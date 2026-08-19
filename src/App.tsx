import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/clients";
import { useAppState } from "@/lib/store";

// A simple debounce utility to prevent spamming the database
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function App() {
  const setUser = useAppState((state) => state.setUser);
  const setCloudState = useAppState((state) => state.setCloudState);

  // 1. Listen for Logins and Hydrate Data
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      // If they just logged in, grab their saved ecosystem from the cloud
      if (session?.user && event === 'SIGNED_IN') {
        const { data, error } = await supabase
          .from('user_ecosystems')
          .select('state_blob')
          .eq('user_id', session.user.id)
          .single();
          
        if (data?.state_blob) {
          setCloudState(data.state_blob as Partial<Parameters<typeof setCloudState>[0]>);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setCloudState]);

  // 2. Subscribe to local changes and push to cloud automatically
  useEffect(() => {
    const syncToCloud = debounce(async (state) => {
      if (!state.user) return; // Do not sync if they haven't created an account
      
      // Extract only the important ecosystem data to save
      const payload = {
        habits: state.habits,
        focusSessions: state.focusSessions,
        totalFruits: state.totalFruits,
      };

      await supabase
        .from('user_ecosystems')
        .upsert(
          { user_id: state.user.id, state_blob: payload, updated_at: new Date().toISOString() }, 
          { onConflict: 'user_id' }
        ); // UPSERT creates a new row if they are new, or updates if they exist
    }, 3000); // Waits 3 seconds after their last action to fire

    // Watch the Zustand store for any changes
    const unsubscribe = useAppState.subscribe((state) => {
      void syncToCloud(state);
    });
    return unsubscribe;
  }, []);

  return (
    // Your standard router/app wrapper goes here
    <div>Your App Content</div>
  );
}