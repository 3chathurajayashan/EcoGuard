import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { config, demoAssignment } from '../config.js';
import { PatrolController } from '../controller/PatrolController.js';
import { BrowserGpsService } from '../services/BrowserGpsService.js';
import { FakeGpsService } from '../services/FakeGpsService.js';
import { HttpSyncGateway } from '../services/HttpSyncGateway.js';
import { IndexedDbLocalDatabase } from '../services/IndexedDbLocalDatabase.js';

const PatrolContext = createContext(null);

/** Build injectable controller dependencies and expose observable state to screens. */
export function PatrolProvider({ children }) {
  const [role, setRole] = useState('Ranger');
  const [offline, setOffline] = useState(false);
  const [state, setState] = useState({});
  const controller = useMemo(() => {
    const gateway = new HttpSyncGateway(config.apiBaseUrl);
    gateway.simulateOffline = offline;
    return new PatrolController({
      gps: import.meta.env.DEV ? new FakeGpsService() : new BrowserGpsService(),
      database: new IndexedDbLocalDatabase(),
      gateway,
      rangerId: role === 'Ranger' ? config.rangerUserId : config.parkManagerUserId,
      assignment: role === 'Ranger' ? demoAssignment : null,
      gpsIntervalMs: config.gpsIntervalMs,
      maxSyncAttempts: config.maxSyncAttempts,
      onStateChange: setState,
    });
  }, [offline, role]);

  useEffect(() => {
    let active = true;
    controller.getAssignedPatrol().then(() => controller.refreshPendingPatrols()).catch((error) => {
      if (active) setState((old) => ({ ...old, error: error.message }));
    });
    const onlineHandler = () => controller.retryPendingSync({ manual: false });
    window.addEventListener('online', onlineHandler);
    const retryInterval = window.setInterval(() => controller.retryPendingSync({ manual: false }), 30_000);
    return () => {
      active = false;
      window.removeEventListener('online', onlineHandler);
      window.clearInterval(retryInterval);
      controller.dispose();
    };
  }, [controller]);

  return (
    <PatrolContext.Provider value={{ controller, state, role, setRole, offline, setOffline }}>
      {children}
    </PatrolContext.Provider>
  );
}

PatrolProvider.propTypes = { children: PropTypes.node.isRequired };

/** Return controller and current Observer state. */
export function usePatrolController() {
  const value = useContext(PatrolContext);
  if (!value) throw new Error('usePatrolController must be used inside PatrolProvider.');
  return value;
}
