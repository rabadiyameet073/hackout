import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Grid,
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Flag as FlagIcon,
} from '@mui/icons-material'
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid'
import { format } from 'date-fns'

// Mock data
const mockIncidents = [
  {
    id: '1',
    title: 'Illegal mangrove cutting in Bay Area',
    type: 'illegal_cutting',
    severity: 'high',
    status: 'pending',
    location: 'Mangrove Bay, Philippines',
    reporter: 'John Doe',
    created_at: '2024-01-15T10:30:00Z',
    validation_score: 4.2,
    ai_confidence: 0.87,
  },
  {
    id: '2',
    title: 'Water pollution detected',
    type: 'pollution',
    severity: 'medium',
    status: 'verified',
    location: 'Coastal Reserve #3',
    reporter: 'Maria Santos',
    created_at: '2024-01-14T15:45:00Z',
    validation_score: 3.8,
    ai_confidence: 0.92,
  },
  {
    id: '3',
    title: 'Land reclamation activity',
    type: 'land_reclamation',
    severity: 'critical',
    status: 'under_review',
    location: 'Protected Area #7',
    reporter: 'Environmental Watch',
    created_at: '2024-01-13T08:20:00Z',
    validation_score: 4.7,
    ai_confidence: 0.95,
  },
  {
    id: '4',
    title: 'Wildlife disturbance reported',
    type: 'wildlife_disturbance',
    severity: 'low',
    status: 'resolved',
    location: 'Bird Sanctuary Zone',
    reporter: 'Bird Watchers Club',
    created_at: '2024-01-12T12:15:00Z',
    validation_score: 3.2,
    ai_confidence: 0.78,
  },
]

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'low': return 'success'
    case 'medium': return 'warning'
    case 'high': return 'error'
    case 'critical': return 'error'
    default: return 'default'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'warning'
    case 'under_review': return 'info'
    case 'verified': return 'success'
    case 'rejected': return 'error'
    case 'resolved': return 'success'
    default: return 'default'
  }
}

export default function IncidentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null)
  const [actionAnchorEl, setActionAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [filters, setFilters] = useState({
    severity: '',
    status: '',
    type: '',
  })

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget)
  }

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, incidentId: string) => {
    event.stopPropagation()
    setSelectedIncident(incidentId)
    setActionAnchorEl(event.currentTarget)
  }

  const handleViewDetails = () => {
    setDetailsOpen(true)
    setActionAnchorEl(null)
  }

  const handleExport = () => {
    // Implementation for exporting incidents
    console.log('Exporting incidents...')
  }

  const columns: GridColDef[] = [
    {
      field: 'title',
      headerName: 'Title',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.location}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value.replace('_', ' ')}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'severity',
      headerName: 'Severity',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value.toUpperCase()}
          size="small"
          color={getSeverityColor(params.value) as any}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value.replace('_', ' ')}
          size="small"
          color={getStatusColor(params.value) as any}
          variant="filled"
        />
      ),
    },
    {
      field: 'reporter',
      headerName: 'Reporter',
      width: 150,
    },
    {
      field: 'validation_score',
      headerName: 'Score',
      width: 100,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {params.value.toFixed(1)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
            /5.0
          </Typography>
        </Box>
      ),
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2">
          {format(new Date(params.value), 'MMM dd, yyyy')}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(e) => handleActionClick(e, params.row.id)}
        >
          <MoreVertIcon />
        </IconButton>
      ),
    },
  ]

  const filteredIncidents = mockIncidents.filter(incident => {
    const matchesSearch = incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.reporter.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSeverity = !filters.severity || incident.severity === filters.severity
    const matchesStatus = !filters.status || incident.status === filters.status
    const matchesType = !filters.type || incident.type === filters.type

    return matchesSearch && matchesSeverity && matchesStatus && matchesType
  })

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Incident Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor, review, and manage reported environmental incidents
        </Typography>
      </Box>

      {/* Toolbar */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search incidents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300 }}
          />
          
          <Button
            startIcon={<FilterIcon />}
            onClick={handleFilterClick}
            variant="outlined"
          >
            Filters
          </Button>

          <Button
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            variant="outlined"
          >
            Export
          </Button>

          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            <Chip label={`${filteredIncidents.length} incidents`} />
          </Box>
        </Box>
      </Card>

      {/* Data Grid */}
      <Card>
        <DataGrid
          rows={filteredIncidents}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 25 },
            },
          }}
          pageSizeOptions={[25, 50, 100]}
          checkboxSelection
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'action.hover',
            },
          }}
          onRowClick={(params: GridRowParams) => {
            setSelectedIncident(params.id as string)
            setDetailsOpen(true)
          }}
        />
      </Card>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
        PaperProps={{ sx: { minWidth: 250 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Filter Incidents
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Severity</InputLabel>
                <Select
                  value={filters.severity}
                  label="Severity"
                  onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="under_review">Under Review</MenuItem>
                  <MenuItem value="verified">Verified</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type}
                  label="Type"
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="illegal_cutting">Illegal Cutting</MenuItem>
                  <MenuItem value="pollution">Pollution</MenuItem>
                  <MenuItem value="land_reclamation">Land Reclamation</MenuItem>
                  <MenuItem value="wildlife_disturbance">Wildlife Disturbance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button
              size="small"
              onClick={() => {
                setFilters({ severity: '', status: '', type: '' })
                setFilterAnchorEl(null)
              }}
            >
              Clear
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => setFilterAnchorEl(null)}
            >
              Apply
            </Button>
          </Box>
        </Box>
      </Menu>

      {/* Action Menu */}
      <Menu
        anchorEl={actionAnchorEl}
        open={Boolean(actionAnchorEl)}
        onClose={() => setActionAnchorEl(null)}
      >
        <MenuItem onClick={handleViewDetails}>
          <ViewIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => setActionAnchorEl(null)}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Status
        </MenuItem>
        <MenuItem onClick={() => setActionAnchorEl(null)}>
          <FlagIcon sx={{ mr: 1 }} />
          Flag for Review
        </MenuItem>
        <MenuItem onClick={() => setActionAnchorEl(null)} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Incident Details
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Detailed incident information would be displayed here...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>
            Close
          </Button>
          <Button variant="contained">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
