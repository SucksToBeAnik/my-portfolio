import { getHomeSettingValues } from "@/actions/site-config";
import { HomeSettingsForm } from "@/components/HomeSettingsForm";

export default async function SettingsPage() {
  const values = await getHomeSettingValues();

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 pt-5 md:pt-2 pb-3 bg-bg/70 backdrop-blur-md">
        <h1 className="text-lg font-heading">Settings</h1>
      </div>
      <HomeSettingsForm values={values} />
    </div>
  );
}
