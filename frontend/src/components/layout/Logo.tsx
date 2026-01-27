import React from 'react';
import { Box, Typography } from '@mui/material';
import WhatshotIcon from '@mui/icons-material/Whatshot';

const Logo: React.FC<{ variant?: 'small' | 'full'; inverted?: boolean }> = ({ variant = 'full', inverted = false }) => {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WhatshotIcon sx={{ color: 'primary.main', fontSize: 32 }} />
            {variant === 'full' && (
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: inverted ? 'common.white' : 'text.primary' }}>
                    Ember<Box component="span" sx={{ color: 'primary.main' }}>.</Box>
                </Typography>
            )}
        </Box>
    );
};

export default Logo;
