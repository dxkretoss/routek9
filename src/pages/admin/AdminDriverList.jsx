import React from 'react';
import { UserListSection } from './components/AdminComponents';

export default function AdminDriverList({ users, loading, error, searchQuery, setSearchQuery, onRefresh, sortField, setSortField, sortDir, setSortDir }) {
  return (
    <UserListSection
      users={users}
      loading={loading}
      error={error}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      roleFilter="driver"
      setRoleFilter={() => {}}
      onRefresh={onRefresh}
      sortField={sortField}
      setSortField={setSortField}
      sortDir={sortDir}
      setSortDir={setSortDir}
      title="Driver List"
      subtitle="All registered contract drivers"
    />
  );
}
