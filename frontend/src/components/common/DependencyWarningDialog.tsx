import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, List, ListItem, ListItemText } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

interface DependencyWarningDialogProps {
    open: boolean;
    title: string;
    message: string;
    blockingItems: string[];
    onClose: () => void;
}

const DependencyWarningDialog: React.FC<DependencyWarningDialogProps> = ({ open, title, message, blockingItems, onClose }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main' }}>
                <WarningIcon />
                {title}
            </DialogTitle>
            <DialogContent>
                <DialogContentText paragraph>
                    {message}
                </DialogContentText>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    Dependent Items:
                </Typography>
                <List dense sx={{ bgcolor: 'background.default', borderRadius: 1 }}>
                    {blockingItems.map((item, index) => (
                        <ListItem key={index}>
                            <ListItemText primary={item} />
                        </ListItem>
                    ))}
                </List>
                <DialogContentText sx={{ mt: 2, fontSize: '0.875rem' }}>
                    Please remove these dependencies before deleting.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary" variant="contained">
                    OK
                </Button>
            </DialogActions>
        </Dialog>
    );
};

import { Typography } from '@mui/material';

export default DependencyWarningDialog;
