"use client";

import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Select } from "~/components/ui/select";
import { useState, useEffect } from "react";

export default function PreferencesPage() {
  const utils = api.useUtils();
  const { data: preferences } = api.preference.getAll.useQuery();
  const { data: user, isLoading } = api.user.getMe.useQuery();
  const [selected, setSelected] = useState<string>("");

  const setDefault = api.preference.setUserDefault.useMutation({
    onSuccess: () => {
      void utils.user.getMe.invalidate();
    },
  });

  useEffect(() => {
    if (user?.defaultPreferenceId) {
      setSelected(user.defaultPreferenceId);
    }
  }, [user?.defaultPreferenceId]);

  const handleSave = () => {
    setDefault.mutate({ preferenceId: selected || null });
  };

  if (isLoading) {
    return <div className="py-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Preferences</h1>
        <p className="text-gray-600">
          Set your default preference for quick meal selection
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Default Meal Preference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            When you open the ordering page, your default preference will be
            pre-selected. This also helps auto-select menu items that match your
            preference.
          </p>

          <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">No default preference</option>
            {preferences?.map((pref) => (
              <option key={pref.id} value={pref.id}>
                {pref.name}
              </option>
            ))}
          </Select>

          <Button onClick={handleSave} disabled={setDefault.isPending}>
            {setDefault.isPending ? "Saving..." : "Save Preference"}
          </Button>

          {setDefault.isSuccess && (
            <p className="text-sm text-green-600">Preference saved!</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {preferences?.map((pref) => (
              <div
                key={pref.id}
                className="rounded-lg bg-gray-50 p-3 text-center"
              >
                <span className="font-medium">{pref.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
