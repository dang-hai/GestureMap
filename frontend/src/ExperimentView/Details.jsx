import React , { useState, useEffect, useMemo } from 'react';

import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    List,
    ListItem,
    ListItemText,
    Collapse,
    Button,
    Box,
    Dialog,
    DialogTitle,
    InputBase,
    IconButton
} from '@material-ui/core'

import DetailsReferents from './DetailsReferents';
import DetailsGestureProposals from './DetailsGestureProposals';
import ClusteringConfig from './ClusteringConfig'
import BarycenterView from './BarycenterView';
import SearchIcon from '@material-ui/icons/Search';
import CloseIcon from '@material-ui/icons/Close';

import {
    useClusteringConfig
} from '../DataServicec'

import { BASE_URL } from '../config';


const EMPTY_LIST = [];
export default function Details(props) {
    const {
        height,
        referents,
        latentTrialDataValues,
        trialSelections,
        referentSelections,
        colors,
        barycenters,
        barycenterSelections
    } = props;
    
    const [ newClusterConfig, setNewClusterConfig ] = useState();
    const [ clusteringConfig, configStatus, configList ] = useClusteringConfig(referents, newClusterConfig);
    const [ onReferentSelected ] = useState(() => props.onReferentSelected);
    const [ onHighlighted ] = useState(() => props.onHighlighted);
    const [ handleSnackbar ] = useState(() => props.handleSnackbar);
    const [ handle3DAnimationClicked ] = useState(() => props.handle3DAnimationClicked);
    const [ handleTrialSelection ] = useState(() => props.handleTrialSelection);
    const [ handleShowBarycenter ] = useState(() => props.handleShowBarycenter);

    const [ expanded, setExpanded ] = useState({});
    const [ clusteringOptionsExpanded, setClusteringOptionsExpanded] = useState(false);
    const [ initClusterState, setInitClusterState ] = useState(null);
    const [ currentFocusedReferent, setCurrentFocusedReferent ] = useState(null);
    const [ loading, setLoading ] = useState(false);
    const [ openDialog, setOpenDialog ] = useState(false);
    const [ searchText, setSearchText ] = useState("");

    const [ filteredReferent, setFilteredReferents ] = useState(EMPTY_LIST);

    useEffect(() => {
        if (referents.data.length !== 0) {
            console.log('Init Expanded Rows');
            setExpanded(Object.fromEntries(
                referents.data.map((d, idx) => (idx === 0) ? [d.GestureType, true] : [d.GestureType, false])))
            setCurrentFocusedReferent(
                referents.data[0].GestureType
            )
        }
    }, [referents])

    useEffect(() => {
        if (configStatus.status === "Configurationlist loaded") {
            setOpenDialog(true);
        } else {
            setOpenDialog(false);
        }
    }, [configStatus.status, configList])

    useEffect(() => {
        if (searchText.length > 0) {
            setFilteredReferents(prev => {
                let update = referents.data.filter(item => {
                    let tmp = item.GestureType.toLowerCase();
                    let searchTerm = searchText.toLocaleLowerCase();

                    return tmp.includes(searchTerm)
                });
                return update;
            })
        } else {
            setFilteredReferents(referents.data);
        }
    }, [ searchText, referents ])

    function handleAnimateBarycenter(barycenter) {
        props.handleAnimateBarycenter(barycenter);
    }

    function handleToggleCentroid(referent, assign_idx, c, toggleStatus) {
        console.log("handleToggleCentroid", referent, assign_idx, c, toggleStatus)

        let vals = Object.values(trialSelections);
        vals = vals.filter(i => i.GestureType === referent);
        let toggleTrials = assign_idx.map(i => {
            let tmp = vals[i];
            tmp['color'] = c;
            return tmp
        })
        props.handleToggleCentroid(toggleTrials)
    }

    function handleSearchInput(evt) {
        setSearchText(evt.target.value);
    }

    function handleClusteringConfig(newConfig) {
        console.log("Processing new newconfig")
        setNewClusterConfig(newConfig)
    }

    function handleExpand(referent) {
        console.log("handleExpand", referent)
        
        if (!expanded[referent] && !referentSelections[referent]) {
            onReferentSelected(referent, true);
            setCurrentFocusedReferent(referent)
        }
        setClusteringOptionsExpanded(false);
        setLoading(false)
        setExpanded(prev => ({ [referent]: !prev[referent] }));
    }

    function handleConfigListItemClick(configItem) {
        handleClusteringConfig({
            key: configItem.referent, 
            change: {
                action: 'load_config_item',
                id: configItem.id
            }
        })
    }

    function handleLoadClicked(referent) {
        console.log('HandleLoadClicked', referent, loading)
        if (!loading) {
            setLoading(true);
            handleClusteringConfig({key: referent, change: {action: 'load'}});
            handleSnackbar({msg: `Loading configuration list for ${referent}`});
        } else {
            setLoading(false);
            handleClusteringConfig({key: referent, change: {action: 'none'}})
        }
    }

    function handleInitCentroidMode(referent, idx) {
        if (referent !== undefined && idx !== undefined) {
            handleSnackbar({msg: `Choose Sequence to initialize centroid: [${referent} | ${idx}]`})
        } else {
            handleSnackbar({msg: `Initialization cancelled`})
        }
    }

    function handleCentroidInitialization(item, idx) {
        handleClusteringConfig({key: item.GestureType, change: {centroid: {idx: idx, data: item}}})
        handleSnackbar({msg: `Centroid initialized! ${item.GestureType}${idx}`})
        setInitClusterState(null);
    }

    function handleConfigureClusteringOptions() {
        setClusteringOptionsExpanded(prev => !prev)
    }

    function handleReassignClusterClicked(item, idx, reassign) {
        handleClusteringConfig({key: item.GestureType, change: {predictions: {idx: idx, new_assign: reassign}}})
    }

    function handleSaveConfigClicked(referent, config) {
        console.log('handleSaveConfigClicked', referent, config)
        fetch(`${BASE_URL}/api/cluster/config/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        })
        .then(res => res.json())
        .then(json => {
            if (json.error !== undefined) {
                handleSnackbar({msg: 'Configuration Saved!'})
            } else {
                handleSnackbar({msg: json.error.msg})
            }
        })
        .catch(console.error)
    }

    function handleEditIconClicked(i) {
        console.log("handleEditIconClicked", i)

        setInitClusterState(prev => {
            let newState;
            console.log(prev)
            if (prev === i) {
                newState = null;
                handleSnackbar({msg: `Cancel Centroid Initialization!`})
            } else {
                newState = i;
                handleSnackbar({msg: `Choose gesture from list to initialize centroid!`})
            }
            return newState
        })
    }

    const cachedProposalView = useMemo(() => {
        console.log('Update Proposal View', expanded, trialSelections, currentFocusedReferent)
        let referent = Object.keys(expanded)[0]
        return <DetailsGestureProposals
            initClusterState={initClusterState}
            handleCentroidInitialization={handleCentroidInitialization}
            referent={referent}
            handleTrialSelection={handleTrialSelection}
            onHighlighted={onHighlighted}
            trialData={latentTrialDataValues.data.filter(d => d.GestureType === referent)}
            trialSelections={trialSelections}
            colors={colors}
            clusteringConfig={clusteringConfig[referent]}
            handle3DAnimationClicked={handle3DAnimationClicked}
            handleReassignClusterClicked={handleReassignClusterClicked}
            />
    }, [expanded,
        initClusterState,
        latentTrialDataValues,
        currentFocusedReferent,
        clusteringConfig,
        colors,
        referentSelections,
        trialSelections])

    const cachedConfigClusterView = useMemo(() => {
        console.log("Recompute Cluster Config View",
        expanded, configStatus, clusteringConfig, initClusterState)

        let referent = Object.keys(expanded)[0]
        return <ClusteringConfig
            loadind={loading}
            handleLoadClicked={handleLoadClicked}
            colors={colors}
            configStatus={configStatus}
            onHighlighted={onHighlighted}
            referent={referent}
            initClusterState={initClusterState}
            handleClusteringConfig={handleClusteringConfig}
            onInitializeCentroid={handleInitCentroidMode}
            handleEditIconClicked={handleEditIconClicked}
            handleSaveConfigClicked={handleSaveConfigClicked}
            handle3DAnimationClicked={handle3DAnimationClicked}
            handleToggleCentroid={handleToggleCentroid}
            clusteringConfig={clusteringConfig[referent]}/>

    }, [configStatus,
        clusteringConfig,
        initClusterState,
        colors,
        loading,
        expanded,
        clusteringOptionsExpanded
    ])

    const cachedConfigListView = useMemo(() => (
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}> 
            <DialogTitle>Choose a configuration</DialogTitle>
            <Paper style={{maxWidth: 300}}>
                <List>
                    {
                    configList.map(configItem =>
                        <ListItem button onClick={() => {
                            handleConfigListItemClick(configItem)
                            setOpenDialog(false);
                            }} key={configItem.id}>
                            <ListItemText 
                                primary={`ID: ${configItem.id}`} 
                                secondary={`Time (UTC): ${configItem.timestamp}`}/>
                        </ListItem>
                    )}
                </List> 
            </Paper>
        </Dialog>
    ), [configList, openDialog, loading])

    const cachedView = useMemo(() => {
        console.log('Update Details View', filteredReferent);
        return filteredReferent.map((item, idx) => (
            <DetailsReferents
                referent={item.GestureType}
                key={item.GestureType}
                colors={colors}
                handleReferentSelection={onReferentSelected}
                handleExpand={handleExpand}
                expanded={expanded}
                referentSelections={referentSelections}
                handleClusteringConfig={handleClusteringConfig}
                handleAnimateBarycenter={handleAnimateBarycenter}>
                <Collapse in={expanded[item.GestureType]} timeout="auto" unmountOnExit>
    
                    <Button
                        variant="outlined"
                        color="secondary"
                        style={{width: "100%"}} 
                        onClick={(evt) => handleConfigureClusteringOptions()}>
                        {clusteringOptionsExpanded ? "Hide" : "Show"} Clustering Options
                    </Button>
                    
                    <Collapse in={clusteringOptionsExpanded} timeout="auto" unmountOnExit>
                        <Box style={{margin: 8}}>
                            { cachedConfigClusterView }
                        </Box>
                    </Collapse>

                    { cachedProposalView }
                    
                    <BarycenterView
                        barycenter={barycenters.data.filter(b => b.Referent === item.GestureType)[0]}
                        barycenterSelected={barycenterSelections.filter(b => b.Referent === item.GestureType).length > 0}
                        handleAnimateBarycenter={handleAnimateBarycenter}
                        handleShowBarycenter={handleShowBarycenter}
                        />
                    
                </Collapse>
            </DetailsReferents>
        ))} ,[ filteredReferent, latentTrialDataValues, trialSelections, referentSelections,
              cachedProposalView, cachedConfigClusterView, cachedConfigListView,
              expanded, clusteringOptionsExpanded, barycenters, barycenterSelections ]);

    return (
        <Paper style={{marginTop: 8}}>
            <Box style={{marginLeft: 8}}>
                <InputBase value={searchText} placeholder="Search" onChange={handleSearchInput}/>
                <IconButton disabled={searchText === 0} onClick={() => setSearchText("")}>
                    {searchText === 0 ? <SearchIcon />: <CloseIcon/>}
                </IconButton>
            </Box>
            <TableContainer style={{maxHeight: height}}>
                <Table stickyHeader padding="none">
                    <TableHead>
                        <TableRow key="table-header">
                            <TableCell size="small"/>
                            <TableCell size="small"/>
                            <TableCell size="small"/>
                            <TableCell size="small"/>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        { cachedView }
                    </TableBody>
                </Table>
            </TableContainer>
            { cachedConfigListView }
        </Paper>
    );
}