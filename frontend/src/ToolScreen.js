import {
    Grid, Paper, Snackbar, Tab, Tabs
} from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import React, { Fragment, useState } from 'react';
import {
    useRouteMatch
} from 'react-router-dom';
// Custom Components
import AnimationSlider from './Animation';
import { BASE_URL } from './config';
import {
    fetch_animation_data, fetch_barycenter, useBaryCenters,
    useInitConfig, useLatentTrialData,
    useOriginalSkeleton, useReconstructedSkeleton,
    useReferents, useSkeletonGrid
} from './DataServicec';
import Details from './ExperimentView/Details';
import MainView from './Layers/Main';
import MetricView from './MetricView';
import ReconstructionView from './ReconstructionView';
import { useColors, useReferentSelections, useTrialSelections } from './utils';
import ViolinPlot from './Violinplot';

const useStyles = makeStyles((theme) =>
    createStyles({
        title: {
            margin: theme.spacing(2, 0, 2),
        },
        root: {
            flexGrow: 1
        },
        highlightInfo: {
            color: 'black',
            transition: "color 1s ease-in-out",
        },
        info: {
            marginTop: 8,
        },
        metricviews: {
            width: "100%",
            height: 450
        },
        background: {
            width: "100%",
            height: "100%",
            position: 'absolute',
            pointerEvents: "none"
        }
    }),
);

const EMPTY_SELECTION = [];
export default function ToolScreen() {
    const match = useRouteMatch();
    const configLoaded = useInitConfig(match.params.configID);

    // const { tabState } = props;
    const classes = useStyles();
    const [domain, setDomain] = useState([[-4, 4], [-4, 4]]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMsg, setSnackbarMsg] = useState('none');
    const [currentHighlighted, setCurrentHighlighted] = useState()
    const [hoverData, setHoverData] = useState({ latent_code: [[0.0, 0.0]], index: undefined })

    const reconstrucedSkeleton = useReconstructedSkeleton(hoverData, configLoaded);
    const originalSkeleton = useOriginalSkeleton(hoverData, configLoaded);
    const skeletonGrid = useSkeletonGrid(domain, configLoaded);

    const referents = useReferents(configLoaded);
    const [referentSelections, setReferentSelections] = useReferentSelections(referents, configLoaded);
    const colors = useColors(referents);

    const latentTrialDataValues = useLatentTrialData(referentSelections, configLoaded);
    const barycenters = useBaryCenters(referentSelections, configLoaded);

    const [trialSelections, setTrialSelections] = useTrialSelections(latentTrialDataValues, configLoaded);

    const [resetAnimation, setResetAnimation] = useState(false);
    const [animationProgress, setAnimationProgress] = useState(0);
    const [playAnimation, setPlayAnimation] = useState(false);
    const [animationData, setAnimationData] = useState();
    const [animation2DData, setAnimation2DData] = useState(null);

    const [barycenterSelections, setBarycenterSelections] = useState(EMPTY_SELECTION);

    const [metricInfoState, setMetricInfoState] = useState(0);


    function handleHover(event) {
        let customData;
        if (event.points[0].data.customdata !== undefined) {
            let index = event.points[0].pointIndex;
            customData = event.points[0].data.customdata[index]
        }

        setHoverData({ latent_code: [[event.xvals[0], event.yvals[0]]], index: customData })
    }

    function onChangeDimensions(event) {
        console.log("Change Dimensions", event)
        if (!event || !event['xaxis.range[0]']) {
            setDomain([[-4, 4], [-4, 4]])
            return;
        }

        let xrange = [event['xaxis.range[0]'], event['xaxis.range[1]']]
        let yrange = [event['yaxis.range[0]'], event['yaxis.range[1]']]
        setDomain([xrange, yrange])
    }

    function handleReferentSelection(referent, newState) {
        console.log("handleReferentSelection", referent, newState)
        // // Deselect all trials within the group if the referent is deslected
        if (newState === false) {
            setTrialSelections(prev => {
                let deselectTrials = Object.entries(prev)
                    .filter((entry) => entry[1]['GestureType'] === referent)
                    .map((entry) => ([entry[0], { ...entry[1], checked: false }]));

                return { ...prev, ...Object.fromEntries(deselectTrials) }
            });
        }
        setReferentSelections(prev => ({ ...prev, [referent]: newState }));
    }

    function handleTrialSelection(key) {
        console.log("handleTrialSelection", trialSelections, key)
        setTrialSelections(s => ({
            ...s,
            [key]: {
                ...s[key],
                checked: !s[key]['checked']
            },
        }));
    }

    function handleToggleCentroid(items) {
        console.log("handleToggleCentroid", items)
        function getKey(it) {
            return `RID${it.GestureType}PID${it.ParticipantID}TID${it.TrialID}`
        }

        setTrialSelections(prev => {
            let keys = items.map(getKey);
            let toggle = Object
                .entries(prev)
                .filter(e => keys.indexOf(e[0]) > -1)
                .map(e => e[1])
                .every(e => e.checked)

            let update = items.map(it => [getKey(it), { ...it, checked: !toggle, color: it.color }])
            update = Object.fromEntries(update)

            return { ...prev, ...update }
        })
    }

    function handleAnimateBarycenter(barycenterData) {
        console.log("Handle Animate Barycenter", barycenterData)
        if (barycenterData !== undefined) {
            let referent = barycenterData.Referent;

            fetch_barycenter((json) => {
                barycenterData.desc = `${referent} Barycenter`
                setAnimationData(json);
                setAnimation2DData(barycenterData);
                setPlayAnimation(true);
                setResetAnimation(true);
            }, barycenterData.Referent, configLoaded)
        }
    }

    function handleSnackbar(obj) {
        setSnackbarMsg(obj.msg)
        setSnackbarOpen(true)
    }

    function handleSnackbarClose() {
        setSnackbarOpen(false)
    }

    function handle3DAnimationClicked(item, idx) {
        console.log("handle3DAnimationClicked", item, idx)
        setResetAnimation(false);
        fetch_animation_data(item, (json) => {
            if (json['error']) {
                handleSnackbar({ msg: `An error occured while animating! ${json.error.msg}` })
                return;
            }

            let detail = item.ParticipantID ? `[${item.ParticipantID}][${item.TrialID}][${idx}]` : idx
            item.desc = `${item.GestureType} ${detail}`

            setAnimation2DData(item);
            setAnimationData(json);
            setPlayAnimation(true);
            setResetAnimation(true);
        })
    }

    function handleAnimationChanged(evt) {
        const { change } = evt;
        setAnimationProgress(change);
    }

    function handleAnimationStart() {
        console.log("On Animation Start")
        setPlayAnimation(true);
    }

    function handleAnimationEnd() {
        console.log("On Animation End")
        setPlayAnimation(false);
        setResetAnimation(false);
    }

    function handleClearAnimation() {
        setResetAnimation(true);
        setPlayAnimation(false);
        setAnimationData(null);
        setAnimation2DData(null);
    }

    function handleShowBarycenter(barycenter) {
        console.log('Handle Show Barycenter', barycenter)

        if (barycenter !== undefined) {
            setBarycenterSelections(prev => {
                let res = prev.filter(i => i.Referent === barycenter.Referent);
                let updated;
                if (res.length > 0) {
                    updated = prev.filter(i => i.Referent !== barycenter.Referent);
                } else {
                    updated = [...prev, barycenter];
                }
                console.log('Updated Barycenter selections', updated)
                return updated;
            })
        }
    }

    function additionalInfo(state) {
        switch (metricInfoState) {
            case 1:
                return <ViolinPlot
                    className={classes.metricviews}
                    colors={colors}
                    referentSelections={referentSelections}
                    configID={configLoaded} />
            default:
                return <MetricView
                    className={classes.metricviews}
                    colors={colors}
                    referentSelections={referentSelections}
                    configID={configLoaded}
                />
        }
    }

    return (
        <Fragment>
            <Grid container className={classes.root} spacing={2}>
                <Grid item key={'side-bar'} lg={3}>


                    <Details
                        height={800}
                        handleShowBarycenter={handleShowBarycenter}
                        handleToggleCentroid={handleToggleCentroid}
                        handle3DAnimationClicked={handle3DAnimationClicked}
                        handleSnackbar={handleSnackbar}
                        colors={colors}
                        latentTrialDataValues={latentTrialDataValues}
                        referents={referents}
                        onReferentSelected={handleReferentSelection}
                        handleTrialSelection={handleTrialSelection}
                        trialSelections={trialSelections}
                        referentSelections={referentSelections}
                        handleAnimateBarycenter={handleAnimateBarycenter}
                        onHighlighted={setCurrentHighlighted}
                        barycenters={barycenters}
                        barycenterSelections={barycenterSelections}
                        hidden={false}
                    />

                </Grid>

                <Grid item key={'preview'} lg={3}>

                    <ReconstructionView
                        playAnimation={playAnimation}
                        animationProgress={animationProgress}
                        animationData={animationData}
                        originalSkeleton={originalSkeleton}
                        reconstructedSkeleton={reconstrucedSkeleton}
                        style={{ width: "100%", minHeight: 300 }} />

                    <AnimationSlider
                        disabled={!animation2DData || !animationData}
                        resetAnimation={resetAnimation}
                        playAnimation={playAnimation}
                        max={animationData ? animationData.data.length : 100}
                        onAnimationChanged={handleAnimationChanged}
                        onAnimationStart={handleAnimationStart}
                        onAnimationEnd={handleAnimationEnd}
                        handleClearAnimation={handleClearAnimation}
                    />


                    {
                        additionalInfo(metricInfoState)
                    }


                    <Paper square>
                        <Tabs
                            variant="scrollable"
                            value={metricInfoState}
                            onChange={(evt, newVal) => setMetricInfoState(newVal)}>
                            <Tab label="Variance" />
                            <Tab label="Median" />
                        </Tabs>
                    </Paper>
                </Grid>

                {/* Main View */}
                <Grid item key={'main-view'} lg={6}>
                    <MainView
                        domain={domain}
                        onChangeDimensions={onChangeDimensions}
                        skeletonGrid={skeletonGrid}
                        scatterPoints={latentTrialDataValues}
                        animation2DData={animation2DData}
                        trialSelections={trialSelections}
                        barycenters={barycenterSelections}
                        colors={colors}
                        playAnimation={playAnimation}
                        currentHighlighted={currentHighlighted}
                        onHover={handleHover}
                        animationProgress={animationProgress}
                    />

                </Grid>

            </Grid>
            <Snackbar
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                message={snackbarMsg}
                key={snackbarMsg}
            >
            </Snackbar>
        </Fragment>
    )
}