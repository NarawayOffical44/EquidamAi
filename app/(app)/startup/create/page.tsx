export const dynamic = 'force-dynamic';

import nextDynamic from 'next/dynamic';

const CreateStartupPage = nextDynamic(() => import('./CreateClient'), { ssr: false });

export default function Page() {
  return <CreateStartupPage />;
}
