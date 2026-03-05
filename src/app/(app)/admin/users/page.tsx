"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";

export default function AdminUsersPage() {
  const utils = api.useUtils();
  const { data: users, isLoading } = api.user.getAll.useQuery();

  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"ADMIN" | "EMPLOYEE">("EMPLOYEE");
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState("");

  const createUser = api.user.create.useMutation({
    onSuccess: () => {
      void utils.user.getAll.invalidate();
      setNewEmail("");
      setNewName("");
      setNewRole("EMPLOYEE");
    },
  });

  const updateRole = api.user.updateRole.useMutation({
    onSuccess: () => void utils.user.getAll.invalidate(),
  });

  const deleteUser = api.user.delete.useMutation({
    onSuccess: () => void utils.user.getAll.invalidate(),
  });

  const setTempPasswordMutation = api.user.setTempPassword.useMutation({
    onSuccess: () => {
      void utils.user.getAll.invalidate();
      setPasswordUserId(null);
      setTempPassword("");
    },
  });

  const clearPassword = api.user.clearPassword.useMutation({
    onSuccess: () => void utils.user.getAll.invalidate(),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName) return;
    createUser.mutate({ email: newEmail, name: newName, role: newRole });
  };

  const handleSetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordUserId || tempPassword.length < 6) return;
    setTempPasswordMutation.mutate({ userId: passwordUserId, password: tempPassword });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
        <p className="text-gray-600">Add users and manage roles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-wrap gap-2">
            <Input
              placeholder="Email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1 min-w-[200px]"
              required
            />
            <Input
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 min-w-[150px]"
              required
            />
            <Select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as "ADMIN" | "EMPLOYEE")}
              className="w-32"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Admin</option>
            </Select>
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? "Adding..." : "Add User"}
            </Button>
          </form>
          {createUser.error && (
            <p className="mt-2 text-sm text-red-600">{createUser.error.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Set Temporary Password Modal */}
      {passwordUserId && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Set Temporary Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetPassword} className="flex gap-2">
              <Input
                type="text"
                placeholder="Temporary password (min 6 chars)"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                className="flex-1"
                minLength={6}
                required
              />
              <Button type="submit" disabled={setTempPasswordMutation.isPending}>
                {setTempPasswordMutation.isPending ? "Setting..." : "Set Password"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setPasswordUserId(null);
                  setTempPassword("");
                }}
              >
                Cancel
              </Button>
            </form>
            <p className="mt-2 text-xs text-orange-700">
              User will be required to change this password on first login.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Users ({users?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-4 text-center text-gray-500">Loading...</div>
          ) : (
            <div className="space-y-2">
              {users?.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    <div className="flex gap-2 text-xs">
                      {user.defaultPreference && (
                        <span className="text-gray-400">
                          Preference: {user.defaultPreference.name}
                        </span>
                      )}
                      {user.password && (
                        <span className={user.tempPassword ? "text-orange-600" : "text-green-600"}>
                          {user.tempPassword ? "🔑 Temp password" : "🔐 Password set"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={user.role}
                      onChange={(e) =>
                        updateRole.mutate({
                          userId: user.id,
                          role: e.target.value as "ADMIN" | "EMPLOYEE",
                        })
                      }
                      className="w-28"
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="ADMIN">Admin</option>
                    </Select>
                    {user.password ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Clear password? User will need AD login.")) {
                            clearPassword.mutate({ userId: user.id });
                          }
                        }}
                        title="Clear password"
                      >
                        🔓
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPasswordUserId(user.id)}
                        title="Set temporary password"
                      >
                        🔑
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Delete this user?")) {
                          deleteUser.mutate({ userId: user.id });
                        }
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
