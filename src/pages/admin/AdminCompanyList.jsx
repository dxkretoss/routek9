import React from 'react';
import { UserListSection } from './components/AdminComponents';

export default function AdminCompanyList({ users, loading, error, searchQuery, setSearchQuery, onRefresh, sortField, setSortField, sortDir, setSortDir }) {
  return (
    <UserListSection
      users={users}
      loading={loading}
      error={error}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      roleFilter="company"
      setRoleFilter={() => {}}
      onRefresh={onRefresh}
      sortField={sortField}
      setSortField={setSortField}
      sortDir={sortDir}
      setSortDir={setSortDir}
      title="Company List"
      subtitle="All registered logistics companies"
    />
  );
}
