import React from 'react';
import { UserListSection } from './components/AdminComponents';

export default function AdminUserList({ users, loading, error, searchQuery, setSearchQuery, roleFilter, setRoleFilter, onRefresh, sortField, setSortField, sortDir, setSortDir }) {
  return (
    <UserListSection
      users={users}
      loading={loading}
      error={error}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      roleFilter={roleFilter}
      setRoleFilter={setRoleFilter}
      onRefresh={onRefresh}
      sortField={sortField}
      setSortField={setSortField}
      sortDir={sortDir}
      setSortDir={setSortDir}
      title="All Users"
      subtitle="Complete list of all registered users"
      showRoleFilter
    />
  );
}
