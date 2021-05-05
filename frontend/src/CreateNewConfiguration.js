import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { BASE_URL } from './config';

import {
    TextField,
    Typography,
    Button,
    Card,
    CardContent,
    LinearProgress,
    InputLabel } from "@material-ui/core";


export default function CreateNewConfiguration(props) {
    const history = useHistory();
    const [ handleCancelClicked ] = useState(() => props.handleCancelClicked)
    
    const [ name, setName ] = useState("");
    const [ modelFiles, setModelFilePath ] = useState();
    const [ dataFiles, setDataFilePath ] = useState();
    const [ uploadProgress, setUploadProgress] = useState(0.0);
    const [ isUploading, setIsUploading] = useState(false);


    function handleSaveClicked() {
        const formData = new FormData();
        
        formData.append('model_file', modelFiles[0])
        formData.append('data_file', dataFiles[0])
        formData.append('name', name)

        let xhr = new XMLHttpRequest();
        xhr.open("POST", `${BASE_URL}/api/config/new`);
        setIsUploading(true);
        xhr.upload.onprogress = function(event) {
            setUploadProgress(event.loaded / event.total * 100);
        };

        xhr.upload.onload = function() {
            setIsUploading(false);
            history.push('/home')
        }
        xhr.send(formData);
    }

    return (<Card style={{...props.style}}>
                {isUploading ?
                    (
                    <CardContent>
                        <Typography variant="h4">Wait for initialization to finish</Typography>
                            <LinearProgress variant="determinate" value={uploadProgress} />
                        <Typography variant="caption">Upload info</Typography>
                    </CardContent>
                    )
                    :
                    <CardContent>
                        <Typography variant="h4">New Configuration</Typography>
                        <form>
                            <TextField 
                                label="Name"
                                value={name}
                                autoComplete="off"
                                onChange={(evt) => setName(evt.target.value)} required/>
                            <InputLabel>Model</InputLabel>
                            <input
                                required={true}
                                type="file"
                                accept=".pth"
                                multiple={false}
                                id="model-btn"
                                onChange={(evt) => setModelFilePath(evt.target.files)}/>
                            <InputLabel>Data</InputLabel>
                            <input
                                required={true}
                                type="file"
                                accept=".csv,.h5"
                                onChange={(evt) => setDataFilePath(evt.target.files)}/>
                            <Button variant='outlined' onClick={handleCancelClicked}>Cancel</Button>
                            <Button variant='outlined' onClick={handleSaveClicked}>Save</Button>
                        </form>
                    </CardContent>
                }
            </Card>
        )
}