import {ChoiceList, IndexFilters, IndexFiltersProps, useSetIndexFiltersMode,} from '@shopify/polaris';
import React, {FC, useCallback, useState} from 'react';
import {useSearchParams} from '@remix-run/react';
import type {TAdminCategoriesLoaderData} from '~/.server/admin/loaders/categories/index/loader';
import {EAccountStatus} from '~/admin/components/UsersTable/UsersTableFilters';
import {reqSortToSort, sortArrToReqSort} from '~/admin/utils/filter.util';

export enum ECategoriesSortVariant {
  createdAt_asc = 'createdAt_asc',
  createdAt_desc = 'createdAt_desc',
  updatedAt_asc = 'updatedAt_asc',
  updatedAt_desc = 'updatedAt_desc',
  deletedAt_asc = 'deletedAt_asc',
  deletedAt_desc = 'deletedAt_desc',
}

export interface FiltersProps {
  query?: TAdminCategoriesLoaderData['query'];
}

export const Filters: FC<FiltersProps> = ({query}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchParams, setSearchParams] = useSearchParams();

  /* SORT START */
  const sortOptions: IndexFiltersProps['sortOptions'] = [
    {label: 'Created', value: reqSortToSort(ECategoriesSortVariant.createdAt_asc), directionLabel: 'Oldest to newest'},
    {label: 'Created', value: reqSortToSort(ECategoriesSortVariant.createdAt_desc), directionLabel: 'Newest to oldest'},
    {label: 'Updated', value: reqSortToSort(ECategoriesSortVariant.updatedAt_asc), directionLabel: 'Oldest to newest'},
    {label: 'Updated', value: reqSortToSort(ECategoriesSortVariant.updatedAt_desc), directionLabel: 'Newest to oldest'},
    {label: 'Deleted', value: reqSortToSort(ECategoriesSortVariant.deletedAt_asc), directionLabel: 'Oldest to newest'},
    {label: 'Deleted', value: reqSortToSort(ECategoriesSortVariant.deletedAt_desc), directionLabel: 'Newest to oldest'},
  ];

  const sortOrder = query?.sort || ECategoriesSortVariant.createdAt_desc;
  const sortSelected = [reqSortToSort(sortOrder)];

  const setSortSelected = (value: string[]) => {
    setSearchParams((prev) => {
      prev.set('sort', sortArrToReqSort(value));
      return prev;
    });
  };

  /* SORT END */

  /* FILTERS START */
  const serverQueryValue = query?.q || '';
  const [queryValue, setQueryValue] = useState(serverQueryValue);

  const timerRef = React.useRef<number | null>(null);

  const handleFiltersQueryChange = useCallback((value: string) => {
    setQueryValue(value);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      setSearchParams((prev) => {
        prev.delete('skip');
        prev.delete('take');

        if (value === '') {
          prev.delete('q');
          return prev;
        }

        prev.set('q', value);
        return prev;
      });
    }, 300);
  }, [setSearchParams]);

  const [status, setAccountStatus] = useState<EAccountStatus | undefined>(
    query?.filters?.status,
  );

  const {mode, setMode} = useSetIndexFiltersMode();

  const handleAccountStatusChange = useCallback(
    (value: EAccountStatus[]) => {
      setAccountStatus(value?.[0]);
      setSearchParams((prev) => {
        prev.delete('skip');
        prev.delete('take');

        if (value.length === 0) {
          prev.delete('status');
          return prev;
        }

        prev.set('status', value[0]);
        return prev;
      });
    },
    [setSearchParams],
  );

  const handleFiltersClearAll = useCallback(() => {
    setQueryValue('');
    setAccountStatus(undefined);

    setSearchParams((prev) => {
      prev.delete('q');
      prev.delete('role');
      prev.delete('status');
      prev.delete('skip');
      prev.delete('take');
      return prev;
    });
  }, [setSearchParams, setAccountStatus]);

  const filters = [
    {
      key: 'status',
      label: 'Account Status',
      filter: (
        <ChoiceList
          title="Role"
          titleHidden
          choices={[
            {
              label: 'Active',
              value: 'active' as const,
            },
            {
              label: 'Inactive',
              value: 'disabled' as const,
            }
          ]}
          selected={status ? [status] : []}
          onChange={handleAccountStatusChange}
          allowMultiple={false}
        />
      ),
      shortcut: true,
    },
  ];

  const appliedFilters: IndexFiltersProps['appliedFilters'] = [];
  if (status && !isEmpty(status)) {
    const key = 'status';
    appliedFilters.push({
      key,
      label: `Account status ${status}`,
      onRemove: handleAccountStatusChange.bind(null, []),
    });
  }
  /* FILTERS END */

  return (
    <IndexFilters
      sortOptions={sortOptions}
      sortSelected={sortSelected}
      queryValue={queryValue}
      queryPlaceholder="Search categories"
      onQueryChange={handleFiltersQueryChange}
      onQueryClear={() => handleFiltersQueryChange('')}
      onSort={setSortSelected}
      filters={filters}
      appliedFilters={appliedFilters}
      onClearAll={handleFiltersClearAll}
      mode={mode}
      setMode={setMode}
      tabs={[]}
      selected={0}
    />
  );
};


function isEmpty(value: string | string[]): boolean {
  if (Array.isArray(value)) {
    return value.length === 0;
  } else {
    return value === '' || value == null;
  }
}
