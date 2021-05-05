import React, { Fragment, useState} from 'react';

import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import CloseIcon from '@material-ui/icons/Close';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import SaveIcon from '@material-ui/icons/Save';
import ShareIcon from '@material-ui/icons/Share';

import { Typography,
    Slider,
    Grid,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    Button, 
    Input,
    makeStyles,
    LinearProgress,
    ListItemAvatar,
    Menu,
    MenuItem,
    Tooltip,
    Toolbar} from '@material-ui/core';


const useStyles = makeStyles({
    clusterBtn: {
        width: "100%",
        marginBottom: 8
    },
    loadBtn: {
        width: 100,
        marginRight: 8,
        marginBottom: 8
    }
})

export default function ClusteringConfig(props) {
    const classes = useStyles();
    const [ anchorElem, setAnchorElem ] = useState(null);
    const [ currentSelectedCentroid, setCurrentSelectedCentroid ] = useState(null);
    const [ currentSelectedCentroidIdx, setCurrentSelectedCentroidIdx ] = useState(-1);

    const { referent, clusteringConfig, configStatus, colors, initClusterState, loading } = props; 
    const [ handleClusterConfig ] = useState(() => props.handleClusteringConfig)
    const [ handle3DAnimationClicked ] = useState(() => props.handle3DAnimationClicked)
    const [ handleEditIconClicked ] = useState(() => props.handleEditIconClicked)
    const [ handleLoadClicked ] = useState(() => props.handleLoadClicked)
    const [ handleSaveConfigClicked ] = useState(() => props.handleSaveConfigClicked)
    
    const handleSliderChange = (event, newValue) => {
        console.log("handleSliderChange", event.target.value)
        handleClusterConfig( { key: referent, change: { K: newValue } })
    };

    const handleInputChange = (event) => {
        console.log("handleInputChange", event.target.value)
        handleClusterConfig( { key: referent, change: { K: event.target.value } })
    };
    
    const handleBlur = () => {
        if (clusteringConfig.K < 0) {
            handleClusterConfig( { key: referent, change: { K: 0 } })
        } else if (clusteringConfig.K > 10) {
            handleClusterConfig( { key: referent, change: { K: 10 } })
        }
    };

    function handletoggleCentroid() {
        let cls_assign_idx = clusteringConfig.predictions
                            .map((item, i) => [item.cls_asign, i])
                            .filter(entry => entry[0] === currentSelectedCentroidIdx)
                            .map(entry => entry[1])
                        
        let c = Object.values(colors)[currentSelectedCentroidIdx]

        props.handleToggleCentroid(referent, cls_assign_idx, c)
        setAnchorElem(null);
        setCurrentSelectedCentroid(null)
    }

    function exportToJsonFile(data) {
        let dataStr = JSON.stringify(data);
        let dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        let exportFileDefaultName = 'cluster_data.json';

        let linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    function handleHighlight(item) {
        if (item !== undefined) {
            props.onHighlighted(item);
        } else {
            console.warn("Cannot highlight", item)
        }
    }

    function handleUnhighlight() {
        props.onHighlighted(null);
    }


    let centers = []

    for (let i=0; i<clusteringConfig.K; i++) {
        centers.push(
            <ListItem key={`Cluster-${i}`}
                onMouseOver={() => handleHighlight(clusteringConfig.centroids[i])}
                onMouseOut={handleUnhighlight}>
                <ListItemAvatar>
                    <IconButton
                        style={{backgroundColor: Object.values(colors)[i]}}
                        edge="end" 
                        onClick={(evt) => handleEditIconClicked(i)}>
                        {initClusterState === i ? <CloseIcon/> : <EditIcon />}
                    </IconButton>
                </ListItemAvatar>
                <ListItemText style={{maxWidth: 120}}>
                    <Input
                        value={clusteringConfig.centroid_names ? clusteringConfig.centroid_names[i] : ""}
                        onChange={(evt) => handleClusterConfig({key: referent, change: {centroid_idx: i, centroid_name: evt.target.value}})}
                        />
                    <span style={{color: clusteringConfig.centroids[i] ? 'green' : 'grey'}}>{clusteringConfig.centroids[i] ? 'Initialized': 'Uninitialized'}</span>
                </ListItemText>
                <ListItemSecondaryAction >
                    <IconButton edge="end" onClick={(evt) => {
                        setCurrentSelectedCentroidIdx(i)
                        setCurrentSelectedCentroid(clusteringConfig.centroids[i]);
                        setAnchorElem(evt.target)
                        }}>
                        <MoreVertIcon />
                    </IconButton>
                </ListItemSecondaryAction>
            </ListItem>
        )
    }

    return (
        <Fragment>
            <Toolbar>
                <Tooltip title="Load existing configuration">
                    <IconButton onClick={(evt) => handleLoadClicked(referent)}>
                        <FolderOpenIcon/>
                    </IconButton>
                </Tooltip>
                <Tooltip title="Save configuration">
                    <span>
                        <IconButton
                            disabled={clusteringConfig.centroids.length !== clusteringConfig.K}
                            onClick={(evt) => handleSaveConfigClicked(referent, clusteringConfig)}
                            >
                            <SaveIcon/>
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title="Export gestures">
                    <span>
                        <IconButton
                            disabled={clusteringConfig.centroids.length !== clusteringConfig.K}
                            onClick={(evt) => exportToJsonFile(clusteringConfig)}
                            >
                            <ShareIcon />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title="Run clustering">
                    <span>  
                        <Button
                            disabled={clusteringConfig.centroids.length !== clusteringConfig.K}
                            variant="outlined"
                            color="secondary"
                            size="small"
                            onClick={(evt) => handleClusterConfig({key: referent, change: {action: 'rerun'}})}
                            >
                            Run
                        </Button>
                    </span>
                </Tooltip>
            </Toolbar>

            <Typography variant="subtitle1">Status: {(configStatus.status) ? configStatus.status: "-"}</Typography>
            {(configStatus.status === "RUNNING") ? <LinearProgress />: ""}
            
            <Typography variant="subtitle1" id="discrete-slider" gutterBottom>
                Configure New Clustering
            </Typography>

            <Typography variant="overline" id="discrete-slider" gutterBottom>
                Number of Clusters K
            </Typography>

            <Grid container spacing={2} alignItems="center" style={{width: "100%"}}>
                <Grid item lg={6}>
                    <Slider
                        value={typeof clusteringConfig.K  === 'number' ? clusteringConfig.K : 0}
                        defaultValue={3}
                        onChange={handleSliderChange}
                        valueLabelDisplay="auto"
                        step={1}
                        marks
                        min={3}
                        max={10}
                    />
                </Grid>
                
                <Grid item>
                    <Input
                        value={clusteringConfig.K}
                        margin="dense"
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        inputProps={{
                            step: 1,
                            min: 3,
                            max: 10,
                            type: 'number',
                        }}/>
                </Grid>
            </Grid>

            Cluster Centers:
            <List dense={true}>
                { centers }
            </List>

            <Menu anchorEl={anchorElem}
                open={Boolean(anchorElem)} 
                onClose={() => {
                    setCurrentSelectedCentroid(null);
                    setAnchorElem(null)
                    }}>
                <MenuItem 
                    onClick={handletoggleCentroid}
                    disabled={currentSelectedCentroid === undefined}>
                    Toggle Assigned Gestures
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        handle3DAnimationClicked(currentSelectedCentroid, clusteringConfig.centroid_names[currentSelectedCentroidIdx]);
                        setAnchorElem(null);
                        setCurrentSelectedCentroid(null);
                    }} disabled={currentSelectedCentroid === undefined}>
                    Animate Centroid
                </MenuItem>
            </Menu>
            
        </Fragment>
    )
}