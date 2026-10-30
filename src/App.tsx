/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StoreProvider } from './store';
import { AppLayout } from './components/layout/AppLayout';

export default function App() {
  return (
    <StoreProvider>
      <AppLayout />
    </StoreProvider>
  );
}

