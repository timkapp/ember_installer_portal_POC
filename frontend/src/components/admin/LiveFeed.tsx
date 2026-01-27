import React, { useState, useEffect } from 'react';
import { Paper, Typography, List, ListItem, ListItemText, ListItemAvatar, Avatar } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

interface ActivityItem {
    id: string;
    text: string;
    type: 'submission' | 'approval' | 'user';
    time: string;
}

const MOCK_ACTIVITY: ActivityItem[] = [
    { id: '1', text: 'New submission for Project #123 (Site Survey)', type: 'submission', time: '5 mins ago' },
    { id: '2', text: 'Admin approved Permitting for Project #99', type: 'approval', time: '1 hr ago' },
    { id: '3', text: 'New Installer "SolarPro Inc" joined', type: 'user', time: '2 hrs ago' },
    { id: '4', text: 'Project #45 completed Installation', type: 'submission', time: '3 hrs ago' },
];

const LiveFeed: React.FC = () => {
    const [items, setItems] = useState<ActivityItem[]>([]);

    useEffect(() => {
        setItems(MOCK_ACTIVITY);
        // Simulate live updates
        const interval = setInterval(() => {
            setItems(prev => {
                const rotated = [...prev];
                const first = rotated.shift();
                if (first) rotated.push(first); // Just rotate for effect
                return rotated;
            });
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'submission': return <AssignmentIcon />;
            case 'approval': return <CheckCircleIcon />;
            case 'user': return <PersonAddIcon />;
            default: return <AssignmentIcon />;
        }
    };

    return (
        <Paper sx={{ p: 2, height: '100%', maxHeight: 400, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>Live Activity</Typography>
            <List>
                {items.map((item) => (
                    <ListItem key={item.id}>
                        <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                {getIcon(item.type)}
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={item.text}
                            secondary={item.time}
                        />
                    </ListItem>
                ))}
            </List>
        </Paper>
    );
};

export default LiveFeed;
