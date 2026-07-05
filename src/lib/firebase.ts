import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue, set, remove, onDisconnect, serverTimestamp } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBQ-WvJWom4hE7sBrLdiDTX8kksQ_6RZuo",
  authDomain: "beatwavepc.firebaseapp.com",
  databaseURL: "https://beatwavepc-default-rtdb.firebaseio.com",
  projectId: "beatwavepc",
  storageBucket: "beatwavepc.firebasestorage.app",
  messagingSenderId: "835660515054",
  appId: "1:835660515054:web:2a03650b9de98622e3d5ff",
  measurementId: "G-CLQ2XLYEF1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export interface ApplicationDetails {
  name: string;
  email: string;
  instagramId: string;
  mobile?: string;
  reason: string;
  timestamp: string;
  approved?: boolean;
}

export interface SystemSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  announcement: string;
  timerTarget: string;
  timerActive: boolean;
  countdownLabel: string;
  themeColor?: 'indigo' | 'amber' | 'emerald' | 'rose';
}

// Push waitlist applications to /applications
export const submitApplication = async (details: ApplicationDetails) => {
  const applicationsRef = ref(db, 'applications');
  return push(applicationsRef, details);
};

// Delete a single application by ID
export const deleteApplication = async (id: string) => {
  const appRef = ref(db, `applications/${id}`);
  return remove(appRef);
};

// Listen to applications count in real-time
export const subscribeToApplicationsCount = (callback: (count: number) => void) => {
  const applicationsRef = ref(db, 'applications');
  return onValue(applicationsRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      callback(Object.keys(data).length);
    } else {
      callback(0);
    }
  });
};

// Listen to system settings (maintenance mode, announcement text, timer settings)
export const subscribeToSettings = (callback: (settings: SystemSettings) => void) => {
  const settingsRef = ref(db, 'settings');
  return onValue(settingsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      // Default fallback settings
      const defaultSettings: SystemSettings = {
        maintenanceMode: false,
        maintenanceMessage: '',
        announcement: '',
        timerTarget: '2026-07-15T12:00:00',
        timerActive: true,
        countdownLabel: 'Beta drops in',
        themeColor: 'indigo'
      };
      // Write initial settings to database
      set(settingsRef, defaultSettings);
      callback(defaultSettings);
    }
  });
};

// Update system settings from Admin Panel
export const updateSystemSettings = async (settings: SystemSettings) => {
  const settingsRef = ref(db, 'settings');
  return set(settingsRef, settings);
};

// Fetch full applications list for admin console
export const fetchApplicationsList = (callback: (list: (ApplicationDetails & { id: string })[]) => void) => {
  const applicationsRef = ref(db, 'applications');
  return onValue(applicationsRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const list = Object.entries(data).map(([id, val]) => ({
        id,
        ...(val as ApplicationDetails)
      }));
      callback(list);
    } else {
      callback([]);
    }
  });
};

// Firebase Presence — track live visitor count
export const setupPresence = (callback: (count: number) => void) => {
  const presenceRef = ref(db, 'presence');
  const myRef = ref(db, `presence/${Math.random().toString(36).slice(2)}`);

  // Write presence on connect
  set(myRef, { online: true, ts: serverTimestamp() });
  // Remove on disconnect
  onDisconnect(myRef).remove();

  // Subscribe to all presence entries
  const unsub = onValue(presenceRef, (snapshot) => {
    callback(snapshot.exists() ? Object.keys(snapshot.val()).length : 0);
  });

  return () => {
    remove(myRef);
    unsub();
  };
};

// Subscribe to database connection status
export const subscribeToConnectionStatus = (callback: (connected: boolean) => void) => {
  const connectedRef = ref(db, ".info/connected");
  return onValue(connectedRef, (snap) => {
    callback(snap.val() === true);
  });
};

// Approve or toggle wave selection for a waitlist applicant
export const approveApplication = async (id: string, approved: boolean) => {
  const appApprovedRef = ref(db, `applications/${id}/approved`);
  return set(appApprovedRef, approved);
};

// Increment total unique visits count (once per session)
export const incrementTotalVisits = async () => {
  if (typeof window !== 'undefined' && !sessionStorage.getItem('beatwave_visited')) {
    sessionStorage.setItem('beatwave_visited', 'true');
    const visitsRef = ref(db, 'stats/totalVisits');
    onValue(visitsRef, (snap) => {
      const current = snap.val() || 0;
      set(visitsRef, current + 1);
    }, { onlyOnce: true });
  }
};

// Subscribe to total unique visits count
export const subscribeToTotalVisits = (callback: (visits: number) => void) => {
  const visitsRef = ref(db, 'stats/totalVisits');
  return onValue(visitsRef, (snap) => {
    callback(snap.val() || 0);
  });
};

// Save a broadcast announcement log to Firebase
export interface BroadcastLog {
  message: string;
  timestamp: string;
  theme?: string;
  sender?: string;
}

export const saveBroadcast = async (log: BroadcastLog) => {
  const broadcastsRef = ref(db, 'broadcasts');
  return push(broadcastsRef, log);
};

// Subscribe to broadcasts history log list
export const subscribeToBroadcasts = (callback: (list: (BroadcastLog & { id: string })[]) => void) => {
  const broadcastsRef = ref(db, 'broadcasts');
  return onValue(broadcastsRef, (snap) => {
    if (snap.exists()) {
      const data = snap.val();
      const list = Object.entries(data).map(([id, val]) => ({
        id,
        ...(val as BroadcastLog)
      })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      callback(list);
    } else {
      callback([]);
    }
  });
};
