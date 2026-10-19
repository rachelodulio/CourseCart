
import { useEffect, useMemo, useState } from "react";

function ActivityLogs({
  activityLogsSearch,
  setActivityLogsSearch,
  activityLogsError,
  activityLogsLoading,
  filteredActivityLogs,
  activityLogs,
  onRefresh,
}) {
  const [actionFilter, setActionFilter] = useState("all");
  const [recordTypeFilter, setRecordTypeFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const actionOptions = useMemo(
    () =>
      [
        ...new Set(
          activityLogs.map((log) =>
            String(log.action || "activity").replace(/_/g, " ")
          )
        ),
      ].sort(),
    [activityLogs]
  );

  const recordTypeOptions = useMemo(
    () =>
      [
        ...new Set(
          activityLogs.map((log) => String(log.entityType || "system"))
        ),
      ].sort(),
    [activityLogs]
  );

  const filteredLogs = useMemo(() => {
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null;

    return filteredActivityLogs.filter((log) => {
      const action = String(log.action || "activity").replace(/_/g, " ");
      const recordType = String(log.entityType || "system");
      const createdAt = log.createdAt ? new Date(log.createdAt) : null;

      if (actionFilter !== "all" && action !== actionFilter) return false;
      if (recordTypeFilter !== "all" && recordType !== recordTypeFilter) {
        return false;
      }

      if (
        from &&
        (!createdAt ||
          Number.isNaN(createdAt.getTime()) ||
          createdAt < from)
      ) {
        return false;
      }

      if (
        to &&
        (!createdAt ||
          Number.isNaN(createdAt.getTime()) ||
          createdAt > to)
      ) {
        return false;
      }

      return true;
    });
  }, [
    filteredActivityLogs,
    actionFilter,
    recordTypeFilter,
    fromDate,
    toDate,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    activityLogsSearch,
    actionFilter,
    recordTypeFilter,
    fromDate,
    toDate,
    pageSize,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLogs.length / pageSize)
  );

  const safePage = Math.min(page, totalPages);

  const pageLogs = filteredLogs.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  function clearFilters() {
    setActivityLogsSearch("");
    setActionFilter("all");
    setRecordTypeFilter("all");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  function getUserName(user) {
    if (!user || typeof user !== "object") {
      return "System / unavailable account";
    }

    return (
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.name ||
      user.username ||
      user.email ||
      "System / unavailable account"
    );
  }

  function getUserRole(user, log) {
    if (!user || typeof user !== "object") return "";

    // Support role fields returned in common account shapes.
    const roleValue =
      user.role ??
      user.roleName ??
      user.accountRole ??
      log.userRole ??
      log.role;

    const role =
      typeof roleValue === "object" && roleValue !== null
        ? roleValue.name ??
          roleValue.roleName ??
          roleValue.title ??
          ""
        : roleValue;

    if (!role || typeof role !== "string") return "";

    return role
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  return (
    <section>
      <div className="panel-heading">
        <div>
          <h3>Activity Logs</h3>
          <p>
            Recent successful changes made in CourseCart. Passwords and
            credentials are never displayed.
          </p>
        </div>

        <div className="activity-heading-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onRefresh}
          >
            Refresh
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div
        className="activity-filters"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div
          className="activity-filter-main-row"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(260px, 2fr) minmax(160px, 1fr) minmax(170px, 1fr)",
            gap: "14px",
            alignItems: "end",
            width: "100%",
          }}
        >
          <label className="activity-search-field" style={{ gridColumn: "auto", minWidth: 0 }}>
            Search
            <input
              type="search"
              value={activityLogsSearch}
              onChange={(event) =>
                setActivityLogsSearch(event.target.value)
              }
              placeholder="Search user, action, record type, or details..."
              aria-label="Search activity logs"
            />
          </label>

          <label>
            Action
            <select
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
            >
              <option value="all">All actions</option>
              {actionOptions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </label>

          <label>
            Record type
            <select
              value={recordTypeFilter}
              onChange={(event) => setRecordTypeFilter(event.target.value)}
            >
              <option value="all">All record types</option>
              {recordTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          className="activity-filter-date-row"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(220px, 1fr))",
            gap: "14px",
            alignItems: "end",
            width: "100%",
            maxWidth: "760px",
          }}
        >
          <label>
            From date
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </label>

          <label>
            To date
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => setToDate(event.target.value)}
            />
          </label>
        </div>
      </div>

      {activityLogsError && (
        <p className="category-error">{activityLogsError}</p>
      )}

      {activityLogsLoading ? (
        <p className="feedback">Loading activity logs...</p>
      ) : (
        <>
          <div className="po-table-wrapper">
            <table className="po-table">
              <thead>
                <tr>
                  <th>Date / Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Record Type</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {pageLogs.map((log) => {
                  const user = log.user || {};
                  const name = getUserName(user);
                  const role = getUserRole(user, log);

                  return (
                    <tr key={log._id}>
                      <td>
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleString()
                          : "—"}
                      </td>

                      <td>
                        {name}
                        {role && (
                          <span className="activity-user-role">
                            {" "}({role})
                          </span>
                        )}
                      </td>

                      <td>
                        {String(log.action || "activity").replace(
                          /_/g,
                          " "
                        )}
                      </td>

                      <td>{log.entityType || "system"}</td>

                      <td>{log.details || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!filteredLogs.length && (
              <p className="feedback">
                {activityLogs.length
                  ? "No activity logs match these filters."
                  : "No activity logs recorded yet. New successful changes will appear here."}
              </p>
            )}
          </div>

          {!!filteredLogs.length && (
            <div className="activity-pagination">
              <span>
                Showing {(safePage - 1) * pageSize + 1}–
                {Math.min(safePage * pageSize, filteredLogs.length)} of{" "}
                {filteredLogs.length} activities
              </span>

              <div className="activity-page-controls">
                <label>
                  Rows per page
                  <select
                    value={pageSize}
                    onChange={(event) =>
                      setPageSize(Number(event.target.value))
                    }
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </label>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setPage(1)}
                  disabled={safePage === 1}
                >
                  First
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setPage((current) => Math.max(1, current - 1))
                  }
                  disabled={safePage === 1}
                >
                  Previous
                </button>

                <span>
                  Page {safePage} of {totalPages}
                </span>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setPage((current) =>
                      Math.min(totalPages, current + 1)
                    )
                  }
                  disabled={safePage === totalPages}
                >
                  Next
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setPage(totalPages)}
                  disabled={safePage === totalPages}
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default ActivityLogs;
