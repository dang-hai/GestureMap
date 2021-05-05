import React, { useState, Fragment } from 'react';

import {
    GridList,
    GridListTile,
    Tooltip,
    Button,
    Typography,
    makeStyles,
    Menu,
    MenuItem,
    Radio
} from '@material-ui/core';

const useStyles = makeStyles({
    btn: {
        ".:hover": {
            borderWidth: 6
        },
        fontSize: 10,
        padding: 0,
        minWidth: 0,
        width: 21,
        height: 18,
        borderWidth: 2,
    },
    grid: {
        marginTop: 8,
        border: props => 
            props.initClusterState !== null ? `2px dashed ${props.colors[props.referent]}` : 'none',
    },
    customTooltip: {
        maxWidth: 80
    }
})

const EMTPY_TILES = [];
export default function DetailsGestureProposals(props) {
    const classes = useStyles(props);
    
    const {
        initClusterState,
        trialSelections,
        colors, 
        referent,
        trialData,
        clusteringConfig,
    } = props;

    const [ handleTrialSelection ] = useState(() => props.handleTrialSelection);
    const [ handleCentroidInitialization ] = useState(() => props.handleCentroidInitialization);
    const [ handle3DAnimationClicked ] = useState(() => props.handle3DAnimationClicked)
    const [ handle2DAnimationClicked ] = useState(() => props.handle2DAnimationClicked)
    const [ handleReassignClusterClicked ] = useState(() => props.handleReassignClusterClicked)
    
    const [anchorEl, setAnchorEl] = useState(null);
    const [currentItem, setCurrentItem] = useState(null);
    const [currentIdx, setCurrentIdx] = useState(-1);
    const [ anchorElemClusterAssign, setAnchorElemClusterAssign ] = useState(null);

    function onHighlighted(item) {
        // console.log('onHighlighted', item);
        if (item !== undefined) {
            props.onHighlighted(item);
        }
    }

    function onGestureProposalClicked(key, item) {
        console.log("Gesutre Proposal selected", key, item)
        if (initClusterState !== null) {
            handleCentroidInitialization(item, initClusterState);
        } else {
            handleTrialSelection(key);
        }
    }

    function handleContextMenu(evt, item, idx) {
        console.log('Open Context Menu', item, idx);
        setAnchorEl(evt.currentTarget);
        setCurrentItem(item);
        setCurrentIdx(idx);
        evt.preventDefault();
    }

    function handleClose() {
        setAnchorEl(null);
        setCurrentItem(null);
        setCurrentIdx(-1);
    }

    function handleMenuItemClicked(id, reassign) {
        console.log("handleMenuItemClicked", id, currentItem, currentIdx, reassign)
        if (id === '2D') {
            if (currentIdx !== -1 ) {
                handle2DAnimationClicked(currentItem, currentIdx);
            }       
        } else if (id === '3D') {
            if (currentIdx !== -1 ) {
                handle3DAnimationClicked(currentItem, currentIdx);
            }
        } else if (id === 'REASSIGN') {
            if (reassign !== -1) {
                handleReassignClusterClicked(currentItem, currentIdx, reassign);
            }
        }
        setCurrentIdx(-1);
        setCurrentItem(null);
        setAnchorElemClusterAssign(null);
        setAnchorEl(null);
    }

    function showNearestNeighbors() {
        props.handleShowNearestNeighbors(currentItem);
        setAnchorEl(null);
        setCurrentItem(null);
        setCurrentIdx(-1);
    }

    const tiles = trialData.map((item, idx) => {
        const rid = item.GestureType;
        const pid = item.ParticipantID;
        const tid = item.TrialID;

        const key = `RID${rid}PID${pid}TID${tid}`
        
        const checked = trialSelections[key] ?
            trialSelections[key].checked : false
    
        const style = {
            borderWidth: checked ? 4 : 1
        }

        let filtered;

        if (clusteringConfig.predictions !== undefined) {
            let pred = clusteringConfig.predictions
            filtered = pred.filter(p => p.GestureType === rid 
                && p.ParticipantID === pid
                && p.TrialID === tid)

            if (filtered.length > 0) {
                let cls_asign = parseInt(filtered[0]['cls_asign'])
                style.color = Object.values(colors)[cls_asign]
            }
        }

        return (
            <GridListTile
                key={key}
                onContextMenu={(evt) => handleContextMenu(evt, item, idx)}
                onMouseOver={() => onHighlighted( item )}
                onMouseOut={() => onHighlighted( null )}>
                <Tooltip
                    disableFocusListener={true}
                    // title={`Referent: ${rid} ParticipantID: ${pid} TrialID: ${tid}`}
                    // classes={{tooltip : classes.customTooltip}}
                    title={
                        <React.Fragment>
                            Referent: {rid}<br/>
                            ParticipantID:  {pid}<br/>
                            TrialID: {tid}<br/>
                        </React.Fragment>
                    }
                    >
                    <Button 
                        key={key}
                        variant="outlined"
                        className={classes.btn}
                        style={style}
                        onClick={() => onGestureProposalClicked(key, item)}>{idx}</Button>
                </Tooltip>
            </GridListTile> 
            )
        })
    
    let cluster_assign_menu = []
    for (let i=0; i < clusteringConfig.K; i++) {
        let item_disabled = false;
        if (clusteringConfig.predictions !== undefined && currentIdx !== -1) {
            item_disabled = parseInt(clusteringConfig.predictions[currentIdx]['cls_asign']) === i
        }
         
        cluster_assign_menu.push(
            <MenuItem key={i} 
                disabled={item_disabled}
                onClick={() => {
                handleMenuItemClicked('REASSIGN', i)
                }}>
                <Radio checked={true} disabled style={{
                    borderRadius: 5,
                    backgroundColor: Object.values(colors)[i],
                    color: Object.values(colors)[i]}}/>
                    
                    {clusteringConfig.centroid_names[i]}

            </MenuItem>
        )
    }
    return (
        <Fragment>
            {
                props.initClusterState !== null? 
                <Typography align="center" style={{color: colors[referent]}}>Select gesture to initialize centroid!</Typography> 
                : ""
            }
            <GridList
                className={classes.grid}
                cols={10}
                cellHeight={20}>
                { tiles }
            </GridList>
            <Menu
                id="simple-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
                >
                {/* <MenuItem onClick={(evt) => handleMenuItemClicked('2D')}>Animate 2D Path</MenuItem> */}
                <MenuItem onClick={(evt) => handleMenuItemClicked('3D')}>Animate Gesture</MenuItem>
                <MenuItem onClick={(evt) => showNearestNeighbors()}>Show Nearest Neighbors</MenuItem>
                {clusteringConfig.predictions !== undefined ? <MenuItem onClick={(evt) => setAnchorElemClusterAssign(evt.target)}>Reassign Cluster</MenuItem> : ""}
            </Menu>
            <Menu 
                anchorEl={anchorElemClusterAssign}
                open={Boolean(anchorElemClusterAssign)}
                onClose={() => setAnchorElemClusterAssign(null)}>
                { cluster_assign_menu }
            </Menu>
        </Fragment>
    )
}