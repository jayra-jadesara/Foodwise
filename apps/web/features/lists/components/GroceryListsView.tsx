// ─────────────────────────────────────────────
// FoodWise · GroceryListsView (Client Component)
// CRUD grocery lists — realtime-ready
// ─────────────────────────────────────────────

"use client";

import {
  Container, Typography, Box, Button, Paper, Stack,
  IconButton, TextField, LinearProgress, Chip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Snackbar, Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import ListAltIcon from "@mui/icons-material/ListAlt";
import { useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/shared/lib/supabase/client";

interface ListItem {
  id: string;
  is_completed: boolean;
}

interface GroceryList {
  id: string;
  title: string;
  is_archived: boolean;
  created_at: string;
  created_by: string;
  grocery_list_items: ListItem[];
}

interface Props {
  userId?: string;
  initialLists: GroceryList[];
}

export function GroceryListsView({ userId, initialLists }: Props) {
  const [lists, setLists] = useState<GroceryList[]>(initialLists);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false, message: "", severity: "success",
  });

  const supabase = getSupabaseBrowserClient();

  const handleCreate = useCallback(async () => {
    const title = newTitle.trim();
    if (!title || !userId) return;

    setCreating(true);
    const { data, error } = await supabase
      .from("grocery_lists")
      .insert({ title, created_by: userId })
      .select("id, title, is_archived, created_at, created_by")
      .single();

    setCreating(false);
    if (error) {
      setSnackbar({ open: true, message: error.message, severity: "error" });
      return;
    }

    setLists((prev) => [{ ...data, grocery_list_items: [] }, ...prev]);
    setNewTitle("");
  }, [newTitle, userId, supabase]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    setDeleting(true);

    const { error } = await supabase
      .from("grocery_lists")
      .delete()
      .eq("id", deleteId);

    setDeleting(false);
    setDeleteId(null);

    if (error) {
      setSnackbar({ open: true, message: error.message, severity: "error" });
    } else {
      setLists((prev) => prev.filter((l) => l.id !== deleteId));
    }
  }, [deleteId, supabase]);

  return (
    <Container maxWidth="sm" sx={{ py: 3, pb: 4 }}>
      {/* ── Header ── */}
      <Stack direction="row" sx={{ mb: 3, alignitems: "center", justifycontent: "space-between" }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Grocery Lists</Typography>
          <Typography variant="body2" color="text.secondary">
            {lists.length} active list{lists.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
        <ListAltIcon color="primary" sx={{ fontSize: 32 }} />
      </Stack>

      {/* ── Create new list ── */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 3 }}>
        <Typography variant="caption" sx={{
          fontWeight: 700, color: "text.secondary",
          fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1
        }}>
          New list
        </Typography>
        <Stack direction="row" spacing={1}>
          <TextField
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Weekly groceries"
            size="small"
            fullWidth
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={creating || !newTitle.trim()}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, minWidth: 80 }}
            startIcon={creating ? <CircularProgress size={14} color="inherit" /> : <AddIcon />}
          >
            {creating ? "" : "Create"}
          </Button>
        </Stack>
      </Paper>

      {/* ── List cards ── */}
      {lists.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{ p: 4, borderRadius: 3, textAlign: "center", borderStyle: "dashed", bgcolor: "transparent" }}
        >
          <Typography sx={{ mb: 1, fontSize: "2rem" }}>🛒</Typography>
          <Typography variant="body2" color="text.secondary">
            No lists yet. Create your first grocery list above.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {lists.map((list) => {
            const total = list.grocery_list_items.length;
            const done = list.grocery_list_items.filter((i) => i.is_completed).length;
            const pct = total > 0 ? (done / total) * 100 : 0;

            return (
              <Paper
                key={list.id}
                variant="outlined"
                sx={{ borderRadius: 3, overflow: "hidden", "&:hover": { borderColor: "primary.main" }, transition: "border-color 0.15s" }}
              >
                <Box sx={{ p: 2, display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.95rem',
                      }}
                    >
                      {list.title}
                    </Typography>

                    <Stack
                      direction="row"
                      sx={{ mt: 0.5, spacing: 0.75, alignItems: "center" }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: '0.7rem' }}
                      >
                        {total === 0 ? 'Empty list' : `${done} / ${total} items`}
                      </Typography>

                      {total > 0 && done === total && (
                        <Chip
                          label="Complete"
                          size="small"
                          color="success"
                          sx={{
                            height: 16,
                            fontSize: '0.6rem',
                            fontWeight: 700,
                          }}
                        />
                      )}
                    </Stack>
                    {total > 0 && (
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          mt: 1, height: 4, borderRadius: 2,
                          bgcolor: "action.hover",
                          "& .MuiLinearProgress-bar": { borderRadius: 2 },
                        }}
                        color={done === total ? "success" : "primary"}
                      />
                    )}
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => setDeleteId(list.id)}
                    sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Divider />
                <Box sx={{ px: 2, py: 1 }}>
                  <Button
                    size="small"
                    startIcon={<AddIcon fontSize="small" />}
                    sx={{ textTransform: "none", fontSize: "0.75rem" }}
                    disabled // Full item management coming in grocery-lists module
                  >
                    Add items (coming soon)
                  </Button>
                </Box>
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* ── Delete confirmation ── */}
      <Dialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              m: 2,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Delete list?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will permanently delete the list and all its items. This can&apos;t be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteId(null)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
}
