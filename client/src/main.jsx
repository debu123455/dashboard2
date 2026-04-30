import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  Bell,
  CheckCircle2,
  LayoutDashboard,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Server,
  Settings,
  Ticket,
  Trash2,
  X
} from "lucide-react";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const priorities = ["All", "Critical", "High", "Normal", "Low"];
const statuses = ["All", "Open", "In Progress", "Resolved"];

const fallbackData = {
  metrics: {
    openTickets: 6,
    resolvedTickets: 2,
    slaRate: 75,
    uptimeRate: 88.5
  },
  tickets: [
    { _id: "1", code: "IT-1048", requester: "Sarah Khan", category: "Laptop setup", priority: "High", status: "In Progress" },
    { _id: "2", code: "IT-1047", requester: "David Miller", category: "VPN access", priority: "Normal", status: "Open" },
    { _id: "3", code: "IT-1046", requester: "Priya Shah", category: "Email issue", priority: "Critical", status: "In Progress" },
    { _id: "4", code: "IT-1045", requester: "Marcus Lee", category: "Password reset", priority: "Low", status: "Resolved" }
  ],
  systems: [
    { _id: "network", name: "Network", score: 92, status: "Healthy" },
    { _id: "servers", name: "Servers", score: 98, status: "Healthy" },
    { _id: "backups", name: "Backups", score: 76, status: "Warning" },
    { _id: "security", name: "Security", score: 88, status: "Healthy" }
  ],
  priorityCounts: [
    { _id: "Critical", count: 1 },
    { _id: "High", count: 1 },
    { _id: "Normal", count: 1 },
    { _id: "Low", count: 1 }
  ],
  weeklyVolume: [
    { label: "Sun", value: 1 },
    { label: "Mon", value: 3 },
    { label: "Tue", value: 4 },
    { label: "Wed", value: 2 },
    { label: "Thu", value: 5 },
    { label: "Fri", value: 3 },
    { label: "Sat", value: 1 }
  ]
};

function App() {
  const [data, setData] = useState(fallbackData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({
    requester: "",
    category: "",
    priority: "Normal",
    status: "Open"
  });

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (priorityFilter !== "All") params.set("priority", priorityFilter);
      if (statusFilter !== "All") params.set("status", statusFilter);

      const response = await fetch(`${API_URL}/api/dashboard?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Dashboard API is unavailable");
      }
      const nextData = await response.json();
      setData(nextData);
    } catch (apiError) {
      setError("Using sample data until the Node API and MongoDB are running.");
      setData(fallbackData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [priorityFilter, statusFilter]);

  const filteredTickets = useMemo(() => {
    const searchText = query.trim().toLowerCase();
    return data.tickets.filter((ticketItem) => {
      const matchesSearch = !searchText || [ticketItem.code, ticketItem.requester, ticketItem.category, ticketItem.priority, ticketItem.status]
        .join(" ")
        .toLowerCase()
        .includes(searchText);
      const matchesPriority = priorityFilter === "All" || ticketItem.priority === priorityFilter;
      const matchesStatus = statusFilter === "All" || ticketItem.status === statusFilter;
      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [data.tickets, query, priorityFilter, statusFilter]);

  async function createTicket(event) {
    event.preventDefault();
    if (!form.requester.trim() || !form.category.trim()) {
      setError("Requester and category are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const response = await fetch(`${API_URL}/api/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!response.ok) {
        throw new Error("Ticket could not be created");
      }
      setForm({ requester: "", category: "", priority: "Normal", status: "Open" });
      await loadDashboard();
    } catch (apiError) {
      setError("Start the Node API and MongoDB before creating tickets.");
    } finally {
      setSaving(false);
    }
  }

  async function updateTicketStatus(ticketId, status) {
    try {
      setError("");
      const response = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) {
        throw new Error("Ticket could not be updated");
      }
      await loadDashboard();
    } catch (apiError) {
      setError("Could not update the ticket. Make sure the API is running.");
    }
  }

  async function deleteTicket(ticketId) {
    try {
      setError("");
      const response = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error("Ticket could not be deleted");
      }
      await loadDashboard();
    } catch (apiError) {
      setError("Could not delete the ticket. Make sure the API is running.");
    }
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">A</span>
          <div>
            <strong>Acolyte</strong>
            <small>IT Dashboard</small>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary navigation">
          <a className="nav-item active" href="#overview"><LayoutDashboard size={18} />Dashboard</a>
          <a className="nav-item" href="#tickets"><Ticket size={18} />Tickets</a>
          <a className="nav-item" href="#systems"><Server size={18} />Systems</a>
          <a className="nav-item" href="#reports"><Activity size={18} />Reports</a>
          <a className="nav-item" href="#settings"><Settings size={18} />Settings</a>
        </nav>

        <div className="support-card">
          <p>Service desk status</p>
          <strong>{loading ? "Loading" : "Operational"}</strong>
          <span>Connected to Node, React, and MongoDB</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="menu-button" type="button" aria-label="Toggle menu" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div>
            <p className="eyebrow">Operations overview</p>
            <h1>IT Support Dashboard</h1>
          </div>

          <div className="topbar-actions">
            <label className="search-box">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && loadDashboard()}
                type="search"
                placeholder="Search tickets..."
              />
            </label>
            <button className="icon-button" type="button" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <button className="primary-button" type="button" onClick={loadDashboard}>
              <RefreshCw size={17} />
              Refresh
            </button>
          </div>
        </header>

        {error && <div className="notice">{error}</div>}

        <section className="metric-grid" id="overview" aria-label="Key metrics">
          <MetricCard title="Open tickets" value={data.metrics.openTickets} note="Active support workload" />
          <MetricCard title="Resolved" value={data.metrics.resolvedTickets} note="Closed successfully" />
          <MetricCard title="SLA compliance" value={`${data.metrics.slaRate}%`} note="Tickets within target" />
          <MetricCard title="System uptime" value={`${data.metrics.uptimeRate}%`} note="Average health score" />
        </section>

        <section className="dashboard-grid">
          <article className="panel chart-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Weekly workload</p>
                <h2>Ticket Volume</h2>
              </div>
              <span className="pill">{loading ? "Loading" : "Live"}</span>
            </div>
            <BarChart data={data.weeklyVolume} />
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Priority mix</p>
                <h2>Current Queue</h2>
              </div>
            </div>
            <PriorityBreakdown priorities={data.priorityCounts} />
          </article>
        </section>

        <section className="ticket-tools">
          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">New request</p>
                <h2>Create Ticket</h2>
              </div>
              <Plus size={22} color="#0f766e" />
            </div>
            <TicketForm form={form} setForm={setForm} saving={saving} onSubmit={createTicket} />
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Queue controls</p>
                <h2>Filters</h2>
              </div>
            </div>
            <div className="filter-grid">
              <label>
                Priority
                <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
                  {priorities.map((priority) => <option key={priority}>{priority}</option>)}
                </select>
              </label>
              <label>
                Status
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  {statuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </label>
              <button className="secondary-button" type="button" onClick={() => {
                setQuery("");
                setPriorityFilter("All");
                setStatusFilter("All");
              }}>
                Clear Filters
              </button>
            </div>
          </article>
        </section>

        <section className="dashboard-grid lower-grid">
          <article className="panel" id="tickets">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Live work</p>
                <h2>Recent Tickets</h2>
              </div>
              <span className="pill">{filteredTickets.length} shown</span>
            </div>
            <TicketTable tickets={filteredTickets} onStatusChange={updateTicketStatus} onDelete={deleteTicket} />
          </article>

          <article className="panel" id="systems">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Infrastructure</p>
                <h2>System Health</h2>
              </div>
              <CheckCircle2 size={22} color="#0f766e" />
            </div>
            <SystemHealth systems={data.systems} />
          </article>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ title, value, note }) {
  return (
    <article className="metric-card">
      <span className="metric-label">{title}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function BarChart({ data }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="bar-chart" aria-label="Ticket volume bar chart">
      {data.map((item) => (
        <div className="bar" key={item.label}>
          <div className="bar-fill" style={{ height: `${Math.max((item.value / maxValue) * 100, 8)}%` }} />
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function PriorityBreakdown({ priorities: priorityCounts }) {
  const normalized = ["Critical", "High", "Normal", "Low"].map((priority) => {
    const item = priorityCounts.find((entry) => entry._id === priority);
    return { priority, count: item ? item.count : 0 };
  });

  return (
    <div className="priority-list">
      {normalized.map((item) => (
        <div className="priority-row" key={item.priority}>
          <span className={`dot ${item.priority.toLowerCase()}`} />
          <span>{item.priority}</span>
          <strong>{item.count}</strong>
        </div>
      ))}
    </div>
  );
}

function TicketForm({ form, setForm, saving, onSubmit }) {
  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <form className="ticket-form" onSubmit={onSubmit}>
      <label>
        Requester
        <input value={form.requester} onChange={(event) => updateField("requester", event.target.value)} placeholder="Employee name" />
      </label>
      <label>
        Category
        <input value={form.category} onChange={(event) => updateField("category", event.target.value)} placeholder="VPN, laptop, email..." />
      </label>
      <label>
        Priority
        <select value={form.priority} onChange={(event) => updateField("priority", event.target.value)}>
          {priorities.filter((priority) => priority !== "All").map((priority) => <option key={priority}>{priority}</option>)}
        </select>
      </label>
      <label>
        Status
        <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
          {statuses.filter((status) => status !== "All").map((status) => <option key={status}>{status}</option>)}
        </select>
      </label>
      <button className="primary-button" type="submit" disabled={saving}>
        <Plus size={17} />
        {saving ? "Saving" : "Add Ticket"}
      </button>
    </form>
  );
}

function TicketTable({ tickets, onStatusChange, onDelete }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Requester</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticketItem) => (
            <tr key={ticketItem._id}>
              <td><strong>{ticketItem.code}</strong></td>
              <td>{ticketItem.requester}</td>
              <td>{ticketItem.category}</td>
              <td><span className={`badge ${ticketItem.priority.toLowerCase()}`}>{ticketItem.priority}</span></td>
              <td>
                <select
                  className={`status-select ${ticketItem.status.toLowerCase().replace(" ", "-")}`}
                  value={ticketItem.status}
                  onChange={(event) => onStatusChange(ticketItem._id, event.target.value)}
                >
                  {statuses.filter((status) => status !== "All").map((status) => <option key={status}>{status}</option>)}
                </select>
              </td>
              <td>
                <button className="danger-button" type="button" aria-label={`Delete ${ticketItem.code}`} onClick={() => onDelete(ticketItem._id)}>
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SystemHealth({ systems }) {
  return (
    <div className="health-list">
      {systems.map((system) => (
        <div className="health-item" key={system._id}>
          <span>{system.name}</span>
          <div className={`progress ${system.score < 80 ? "warning" : ""}`}>
            <span style={{ width: `${system.score}%` }} />
          </div>
          <strong>{system.score}%</strong>
        </div>
      ))}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
