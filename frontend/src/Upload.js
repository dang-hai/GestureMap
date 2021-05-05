import React from 'react';
import { LinearProgress, Card, Typography } from '@material-ui/core';


export default function UploadStatus(props) {
    return (
        <Card>
            <Typography variant="h4">Wait for initialization to finish</Typography>
            <LinearProgress/>
            <Typography variant="caption">Upload info</Typography>
        </Card>
    )
}