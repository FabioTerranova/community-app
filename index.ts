import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent ruft AppRegistry.registerComponent('main', () => App) auf
// und sorgt dafuer, dass die App in Expo Go, im Native-Build und im Web laeuft.
registerRootComponent(App);
