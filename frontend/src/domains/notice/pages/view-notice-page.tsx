import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import { Edit, Save, Cancel, ArrowBack, Delete } from '@mui/icons-material';
import { toast } from 'react-toastify';

import {
  useGetNoticeDetailQuery,
  useUpdateNoticeMutation,
  useDeleteNoticeMutation,
} from '../api/notice-api';
import { useHandleNoticeStatusMutation } from '../api/notice-api';

export default function ViewNoticePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const noticeId = parseInt(id || '0');

  // State for editable fields
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [audience, setAudience] = useState('');
  const [priority, setPriority] = useState('');

  // Queries and mutations
  const { data, isLoading, error } = useGetNoticeDetailQuery(
    noticeId ? noticeId.toString() : undefined,
    { skip: !noticeId }
  );
  const [updateNotice, { isLoading: isUpdating }] = useUpdateNoticeMutation();
  const [deleteNotice, { isLoading: isDeleting }] = useDeleteNoticeMutation();
  const [handleStatus, { isLoading: isStatusUpdating }] = useHandleNoticeStatusMutation();

  // Populate form when data loads
  useEffect(() => {
    if (data) {
      setTitle(data.title || '');
      setDescription(data.description || '');
      setAudience(data.audience || '');
      setPriority(data.priority || '');
    }
  }, [data]);

  // Handle save/update
  const handleSave = async () => {
    if (!noticeId) return;

    try {
      await updateNotice({
        id: noticeId,
        title,
        description, 
        audience,
        priority,
      }).unwrap();
      toast.success('Notice updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update notice');
      console.error(error);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!noticeId) return;

    if (window.confirm('Are you sure you want to delete this notice?')) {
      try {
        await deleteNotice(noticeId).unwrap();
        toast.success('Notice deleted successfully');
        navigate('/app/notices');
      } catch (error) {
        toast.error('Failed to delete notice');
        console.error(error);
      }
    }
  };

  // Handle status change (approve/reject)
  const handleStatusChange = async (status: number) => {
    if (!noticeId) return;

    try {
      await handleStatus({ id: noticeId, status }).unwrap();
      toast.success('Notice status updated!');
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate('/app/notices');
  };

  // Show loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load notice. Please try again.
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={handleBack} sx={{ mt: 2 }}>
          Back to Notices
        </Button>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Notice not found</Alert>
        <Button startIcon={<ArrowBack />} onClick={handleBack} sx={{ mt: 2 }}>
          Back to Notices
        </Button>
      </Box>
    );
  }


  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header with actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button startIcon={<ArrowBack />} onClick={handleBack}>
            Back
          </Button>
          <Stack direction="row" spacing={1}>
            {!isEditing && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => setIsEditing(true)}
                  disabled={isDeleting}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? <CircularProgress size={20} /> : 'Delete'}
                </Button>
              </>
            )}
          </Stack>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Title */}
        {isEditing ? (
          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 3 }}
          />
        ) : (
          <Typography variant="h4" gutterBottom>
            {data.title}
          </Typography>
        )}

        {}
        {isEditing ? (
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 3 }}
          />
        ) : (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {data.description || 'No description provided'}
            </Typography>
          </Box>
        )}

        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Audience */}
          <Grid item xs={12} sm={6}>
            {isEditing ? (
              <TextField
                fullWidth
                label="Audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
            ) : (
              <>
                <Typography variant="subtitle2" color="text.secondary">
                  Audience
                </Typography>
                <Chip label={data.audience || 'All'} size="small" />
              </>
            )}
          </Grid>

          {}
          <Grid item xs={12} sm={6}>
            {isEditing ? (
              <TextField
                fullWidth
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              />
            ) : (
              <>
                <Typography variant="subtitle2" color="text.secondary">
                  Priority
                </Typography>
                <Chip
                  label={data.priority || 'Medium'}
                  color={
                    data.priority === 'High' || data.priority === 'Urgent'
                      ? 'error'
                      : data.priority === 'Medium'
                      ? 'warning'
                      : 'info'
                  }
                  size="small"
                />
              </>
            )}
          </Grid>
        </Grid>

        {/* Status */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Status
          </Typography>
          <Chip
            label={data.status || 'Draft'}
            color={
              data.status === 'Published'
                ? 'success'
                : data.status === 'Pending'
                ? 'warning'
                : 'default'
            }
          />
        </Box>

        {/* Admin Actions */}
        {data.status === 'Pending' && (
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="success"
              onClick={() => handleStatusChange(2)} // 2 = Published
              disabled={isStatusUpdating}
            >
              Approve
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleStatusChange(3)} // 3 = Rejected
              disabled={isStatusUpdating}
            >
              Reject
            </Button>
          </Box>
        )}

        {/* Edit/Save Actions */}
        {isEditing && (
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={() => {
                setIsEditing(false);
                // Reset to original values
                if (data) {
                  setTitle(data.title || '');
                  setDescription(data.description || '');
                  setAudience(data.audience || '');
                  setPriority(data.priority || '');
                }
              }}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={isUpdating}
            >
              {isUpdating ? <CircularProgress size={20} /> : 'Save Changes'}
            </Button>
          </Box>
        )}

        {/* Metadata */}
        <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #eee' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                Author
              </Typography>
              <Typography variant="body2">{data.author || 'Unknown'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                Created
              </Typography>
              <Typography variant="body2">
                {data.createdDate
                  ? new Date(data.createdDate).toLocaleString()
                  : 'N/A'}
              </Typography>
            </Grid>
            {data.updatedDate && (
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body2">
                  {new Date(data.updatedDate).toLocaleString()}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}