import { getAirtableDraws, getUniqueFieldValues } from '@/lib/airtable';
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
      <DrawTrackerClient
        title="Draw Tracker"
        description="Explore the latest Provincial and Federal immigration draws."
        initialDraws={initialDraws}
        initialOffset={initialOffset}
        initialError={initialError || filterOptionsError}
        provinceOptions={provinceOptions}
        categoryOptions={categoryOptions}
      />
  );
}

export default DrawTrackerPage;
