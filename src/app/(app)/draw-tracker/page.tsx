
import { getAirtableDraws, getUniqueFieldValues, type Draw } from '@/lib/airtable';
import { withAuth } from '@/hooks/use-auth';
import { DrawTrackerClient } from '@/components/draw-tracker-client';

async function DrawTrackerPage() {
  // Fetch initial data on the server
  const [initialDrawsResult, provincesResult, categoriesResult] = await Promise.all([
    getAirtableDraws(),
    getUniqueFieldValues('Province'),
    getUniqueFieldValues('Category')
  ]);

  const initialDraws = initialDrawsResult.draws?.map(d => ({ ...d.fields, id: d.id })) ?? [];
  const initialOffset = initialDrawsResult.offset;
  const initialError = initialDrawsResult.error;

  const provinceOptions = provincesResult.values ? ['All', ...provincesResult.values] : ['All'];
  const categoryOptions = categoriesResult.values ? ['All', ...categoriesResult.values] : ['All'];
  const filterOptionsError = provincesResult.error || categoriesResult.error;

  return (
    <div className="space-y-6">
       <header>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Draw Tracker</h1>
        <p className="text-muted-foreground">
          Explore the latest Provincial and Federal immigration draws.
        </p>
      </header>
      <DrawTrackerClient
        initialDraws={initialDraws}
        initialOffset={initialOffset}
        initialError={initialError || filterOptionsError}
        provinceOptions={provinceOptions}
        categoryOptions={categoryOptions}
      />
    </div>
  );
}

export default withAuth(DrawTrackerPage);
