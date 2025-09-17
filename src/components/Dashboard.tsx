import data from "./assessment_data.json";
import { useState, useMemo, useRef, useEffect, useCallback, memo } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  ModuleRegistry,
  GridOptions,
  GridReadyEvent,
} from "ag-grid-community";
import { AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

// Register only community modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Define TypeScript interface for employee data
interface EmployeeData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  salary: number;
  hireDate: string;
  age: number;
  location: string;
  performanceRating: number;
  projectsCompleted: number;
  isActive: boolean;
  skills: string[];
  manager: string | null;
}

// Memoized cell renderers to optimize performance
const IsActiveCellRenderer = memo(({ value }: { value: boolean }) => (
  <span
    className={`px-2 py-1 rounded-full text-sm ${
      value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
    }`}
  >
    {value ? "Active" : "Inactive"}
  </span>
));

const SkillsCellRenderer = memo(({ value }: { value: string[] }) => {
  const maxTags = 3; // Limit to 3 tags to prevent excessive wrapping
  return (
    <div className="flex flex-wrap gap-1 pt-1 pb-1">
      {Array.isArray(value) && value.length > 0 ? (
        value.slice(0, maxTags).map((skill, index) => (
          <span
            key={index}
            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded truncate"
            title={skill} // Show full text on hover
          >
            {skill.length > 15 ? `${skill.substring(0, 15)}...` : skill}{" "}
            {/* Truncate long skills */}
          </span>
        ))
      ) : (
        <span>No skills</span>
      )}
      {Array.isArray(value) && value.length > maxTags && (
        <span className="text-gray-500 text-xs">
          +{value.length - maxTags} more
        </span>
      )}
    </div>
  );
});

const ManagerCellRenderer = memo(({ value }: { value: string | null }) => (
  <span className="text-gray-800">{value !== null ? value : "None"}</span>
));

const Dashboard: React.FC = () => {
  // Employee dataset
  const [rowData] = useState<EmployeeData[]>(data.employees);

  const gridRef = useRef<AgGridReact>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Define column definitions
  const columnDefs: ColDef<EmployeeData>[] = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 90, sortable: true },
      {
        field: "firstName",
        headerName: "First Name",
        filter: "agTextColumnFilter",
        sortable: true,
      },
      {
        field: "lastName",
        headerName: "Last Name",
        filter: "agTextColumnFilter",
        sortable: true,
      },
      {
        field: "email",
        headerName: "Email",
        filter: "agTextColumnFilter",
        sortable: true,
      },
      {
        field: "department",
        headerName: "Department",
        filter: "agTextColumnFilter",
        sortable: true,
      },
      {
        field: "position",
        headerName: "Position",
        filter: "agTextColumnFilter",
        sortable: true,
      },
      {
        field: "salary",
        headerName: "Salary ($)",
        filter: "agNumberColumnFilter",
        sortable: true,
        valueFormatter: (params) => `$${params.value.toLocaleString()}`,
      },
      {
        field: "hireDate",
        headerName: "Hire Date",
        filter: "agDateColumnFilter",
        sortable: true,
        valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
      },
      {
        field: "age",
        headerName: "Age",
        filter: "agNumberColumnFilter",
        sortable: true,
      },
      {
        field: "location",
        headerName: "Location",
        filter: "agTextColumnFilter",
        sortable: true,
      },
      {
        field: "performanceRating",
        headerName: "Performance Rating",
        filter: "agNumberColumnFilter",
        sortable: true,
        valueFormatter: (params) => params.value.toFixed(1),
      },
      {
        field: "projectsCompleted",
        headerName: "Projects Completed",
        filter: "agNumberColumnFilter",
        sortable: true,
      },
      {
        field: "isActive",
        headerName: "Active",
        filter: "agTextColumnFilter",
        sortable: true,
        cellRenderer: IsActiveCellRenderer,
        valueFormatter: (params) => (params.value ? "Active" : "Inactive"),
      },
      {
        field: "skills",
        headerName: "Skills",
        filter: "agTextColumnFilter",
        sortable: true,
        type: "textColumn",
        minWidth: 200, // Increased minimum width to accommodate multiple tags
        autoHeight: true, // Allow row height to adjust dynamically
        cellRenderer: SkillsCellRenderer,
        valueFormatter: (params) =>
          Array.isArray(params.value) ? params.value.join(", ") : "No skills",
      },
      {
        field: "manager",
        headerName: "Manager",
        filter: "agTextColumnFilter",
        sortable: true,
        type: "textColumn",
        cellRenderer: ManagerCellRenderer,
        valueFormatter: (params) =>
          params.value !== null ? params.value : "None",
      },
    ],
    []
  );

  // Default column properties
  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      minWidth: 100,
      filter: true,
      resizable: true,
    }),
    []
  );

  // Grid options with custom column types
  const gridOptions: GridOptions<EmployeeData> = useMemo(
    () => ({
      columnTypes: {
        textColumn: {
          filter: "agTextColumnFilter",
          sortable: true,
          resizable: true,
        },
      },
      domLayout: "autoHeight", // Enable auto layout for dynamic height
    }),
    []
  );

  // Memoized function to calculate dynamic page size
  const calculateDynamicPageSize = useCallback(() => {
    if (gridRef.current?.api) {
      console.log("Grid API available:", gridRef.current.api); // Debug log
      const containerHeight = containerRef.current?.clientHeight || 400; // Fallback to 400px
      const rowHeight =
        gridRef.current.api.getSizesForCurrentTheme().rowHeight || 30;
      const headerHeight = 50; // Approximate header height
      const availableHeight = containerHeight - headerHeight;
      const newPageSize = Math.max(1, Math.floor(availableHeight / rowHeight));
    } else {
      console.log("Grid API not available yet"); // Debug log
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Employee Dashboard
        </h1>
        <div ref={containerRef} className="bg-white shadow-md rounded-lg p-4">
          <div
            className="ag-theme-alpine"
            style={{ height: "100%", minHeight: "400px" }}
          >
            <AgGridReact
              ref={gridRef}
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              gridOptions={gridOptions}
              pagination={true}
              paginationPageSize={10}
              paginationPageSizeSelector={[10, 20, 50, 100]}
              animateRows={true}
              rowSelection={{ mode: "multiRow" }}
              enableCellTextSelection={true}
              theme="legacy"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
