import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Button,
    Box,
    Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

interface Column {
    id: string;
    label: string;
    minWidth?: number;
    format?: (value: any) => string;
}

interface ConfigTableProps {
    title: string;
    columns: Column[];
    rows: any[];
    onAdd: () => void;
    onEdit: (row: any) => void;
    onDelete: (row: any) => void;
}

const ConfigTable: React.FC<ConfigTableProps> = ({
    title,
    columns,
    rows,
    onAdd,
    onEdit,
    onDelete
}) => {
    return (
        <Box sx={{ width: '100%', mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" component="div">
                    {title}
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
                    Add New
                </Button>
            </Box>
            <TableContainer component={Paper}>
                <Table stickyHeader aria-label="sticky table">
                    <TableHead>
                        <TableRow>
                            {columns.map((column) => (
                                <TableCell
                                    key={column.id}
                                    style={{ minWidth: column.minWidth, fontWeight: 'bold' }}
                                >
                                    {column.label}
                                </TableCell>
                            ))}
                            <TableCell align="right" style={{ minWidth: 100 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                                {columns.map((column) => {
                                    const value = row[column.id];
                                    return (
                                        <TableCell key={column.id}>
                                            {column.format ? column.format(value) : value}
                                        </TableCell>
                                    );
                                })}
                                <TableCell align="right">
                                    <IconButton onClick={() => onEdit(row)} color="primary" size="small">
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton onClick={() => onDelete(row)} color="error" size="small">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 3 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No items found. Click "Add New" to create one.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default ConfigTable;
