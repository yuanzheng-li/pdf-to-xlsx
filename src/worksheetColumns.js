'use strict';

const columns = [
  {
    header: 'id',
    key: 'id',
    width: 10,
  },
  {
    header: 'operation_name',
    key: 'operationName',
    width: 50,
  },
  {
    header: 'ind_month',
    key: 'indMonth',
    width: 10,
    int: true, // not a property of exceljs
  },
  {
    header: 'infant',
    key: 'infant',
    width: 10,
    int: true,
  },
  {
    header: 'age1',
    key: 'age1',
    width: 10,
    int: true,
  },
  {
    header: 'age2',
    key: 'age2',
    width: 10,
    int: true,
  },
  {
    header: 'age3',
    key: 'age3',
    width: 10,
    int: true,
  },
  {
    header: 'age4',
    key: 'age4',
    width: 10,
    int: true,
  },
  {
    header: 'age5',
    key: 'age5',
    width: 10,
    int: true,
  },
  {
    header: 'age5_12',
    key: 'age512',
    width: 10,
    int: true,
  },
  {
    header: 'enrollment_total',
    key: 'enrollmentTotal',
    width: 20,
    int: true,
  },
  {
    header: 'licensed_capacity',
    key: 'licensedCapacity',
    width: 20,
    int: true,
  },
  {
    header: 'max_capacity',
    key: 'maxCapacity',
    width: 20,
    int: true,
  },
  {
    header: 'no_emp',
    key: 'noEmp',
    width: 10,
    int: true,
  },
  {
    header: 'category_operation',
    key: 'categoryOperation',
    width: 30,
  },
  {
    header: 'operation_site',
    key: 'operationSite',
    width: 30,
  },
  {
    header: 'scc',
    key: 'scc',
    width: 5,
  },
  {
    header: 'qris',
    key: 'qris',
    width: 5,
    int: true,
  },
  {
    header: 'type',
    key: 'type',
    width: 20,
  },
  {
    header: 'county',
    key: 'county',
    width: 20,
  },
  {
    header: 'year',
    key: 'year',
    width: 10,
    int: true,
  },
];

module.exports = columns;