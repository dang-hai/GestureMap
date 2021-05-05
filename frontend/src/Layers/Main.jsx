import React, { useRef, useEffect, useState  } from 'react';

import Plotly from 'plotly.js-dist';
import SkeletonGrid from './SkeletonGrid';
import ScatterPlot from './ScatterPlot';
import BaryCenter from './BaryCenter';
import DensityPlot from './Density';
import * as d3 from 'd3';
import { Paper, Tab, Tabs } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
    root: {
        width: "100%",
        minHeight: 712,
        position: 'relative' 
    },
    background: {
        width: "100%",
        height: "100%",
        position: 'absolute',
        pointerEvents: "none"
    },
    foreground: {
        width: "100%",
        height: "100%",
        position: 'absolute',
        pointerEvents: "auto" 
    }
})

export default function MainView(props) {
    const classes = useStyles();
    const foregroundPlot = useRef(null);
    const [onChangeDimensions] = useState(() => props.onChangeDimensions);
    const [onHover] = useState(() => props.onHover)
    const {
        playAnimation,
        animationProgress,
        animation2DData,
        barycenters,
        scatterPoints,
        trialSelections,
        colors,
        skeletonGrid,
        domain,
        currentHighlighted
    } = props;
    
    const [ tabState, setTabState ] = useState(0);
    const [minX, maxX] = domain[0];
    const [minY, maxY] = domain[1];

    const layout = {
        showlegend: false,
        margin: {
            t: 0, b: 0, l: 0, r: 0, padding: 0
        },
        hovermode: false,
        paper_bgcolor: '#00000000',
        plot_bgcolor: '#00000000',
        xaxis: {
            range: [minX, maxX],
            showgrid: false,
            zeroline: false
        },
        yaxis: {
            range: [minY, maxY],
            showgrid: false,
            zeroline: false
        }
    };

    const config = {}

    useEffect(() => {
        console.log('Create Animation Plot Layer.');
        Plotly.react(foregroundPlot.current, [], layout, config);

        let container = d3.select(foregroundPlot.current)

        container.on('mousemove', function() {
            let [x, y] = d3.mouse(this);
            let scaterPlotDom = d3.select('#scatterfront').node()

            if (scaterPlotDom) {
                Plotly.Fx.hover(scaterPlotDom, {xpx:x, ypx:y})
            }

            let xInDataCoord = foregroundPlot.current._fullLayout.xaxis.p2c(x)
            let yInDataCoord = foregroundPlot.current._fullLayout.yaxis.p2c(y)
            onHover({points: [{data: {}}], xvals: [xInDataCoord], yvals: [yInDataCoord]})
        });

        foregroundPlot.current.on('plotly_relayout', onChangeDimensions)
    }, [])

    useEffect(() => {
        let arr = Object.values(trialSelections).filter(obj => obj.checked)
        console.log('selected Trials', arr)
        if (arr.length > 0) {
            const data = [
                    ...arr.map((seq) => ({
                        x: seq.z1,
                        y: seq.z2,
                        mode: "lines",
                        // mode: "markers",                    
                        line: {
                            width: 2,
                            // dash: "dot",
                            // color: seq.color ?  seq.color + "A0": colors[seq.GestureType] + "A0",
                            // color: 'Black',
                        },
                        marker: {
                            size: 5,
                            // color: seq.color ?  seq.color : colors[seq.GestureType]
                            // color: 'dash',
                            // color: 'Black',
                        },
                    })),
                ]
        
            Plotly.react(foregroundPlot.current, data, layout, config);
        } else {
            Plotly.react(foregroundPlot.current, [], layout, config);
        }

    }, [ trialSelections ])


    useEffect(() => {
        if (scatterPoints.data.length > 0 
                && currentHighlighted !== null
                && currentHighlighted !== undefined
                && !playAnimation) {
            let cc = currentHighlighted
            let xAxis = foregroundPlot.current._fullLayout.xaxis;
            let yAxis = foregroundPlot.current._fullLayout.yaxis;

            let points = cc['z1'].map((p, i) => `${xAxis.c2p(p)},${yAxis.c2p(cc['z2'][i])}`).join(' ')

            // Init Marker definition
            let markerDef = d3.select('#foreground .main-svg defs')
                .append('marker')
            
            markerDef.attr('id', 'highlight-dot')
                .attr('viewBox', "0 0 10 10")
                .attr('refX', 5)
                .attr('refY', 5)
                .attr('markerWidth', 4)
                .attr('markerHeight', 4)
            
            markerDef.append('circle')
                .attr('cx', 5)
                .attr('cy', 5)
                .attr('r', 2)
                .attr('fill', 'black')

            // Init Marker definition
            let startDef = d3.select('#foreground .main-svg defs')
                .append('marker')
            
                startDef.attr('id', 'start-dot')
                .attr('viewBox', "0 0 10 10")
                .attr('refX', 5)
                .attr('refY', 5)
                .attr('markerWidth', 10)
                .attr('markerHeight', 10)
            
                startDef.append('circle')
                .attr('cx', 5)
                .attr('cy', 5)
                .attr('r', 3)
                .attr('fill', '#00FF00AA')

            let endDef = d3.select('#foreground .main-svg defs')
                .append('marker')
            
                endDef.attr('id', 'end-dot')
                .attr('viewBox', "0 0 10 10")
                .attr('refX', 5)
                .attr('refY', 5)
                .attr('markerWidth', 10)
                .attr('markerHeight', 10)
            
                endDef.append('circle')
                .attr('cx', 5)
                .attr('cy', 5)
                .attr('r', 3)
                .attr('fill', '#FF0000AA')
            
            let plot = d3.select('#foreground .plot')

            plot.append('polyline')
                .attr('id', 'highlight-line')
                .attr('points', points)
                .attr('marker-start', "url(#start-dot")
                .attr('marker-mid', "url(#highlight-dot)")
                .attr('marker-end', "url(#end-dot)")
                .style('fill', 'none')
                .style('stroke', 'black')
                .style('stroke-width', '4')
        } else {
            d3.selectAll('#highlight-line').remove();
            d3.selectAll('#highlight-dot').remove();  
        }
    }, [currentHighlighted])

    useEffect(() => {
        // console.log('Animate 2D Data', animation2DData, animationProgress)
        if (animation2DData !== null && animationProgress !== undefined) {
            // setplayAnimation(true);

            let { z1, z2 } = animation2DData;
            let data = [
                    {
                        x: [ z1[animationProgress] ],
                        y: [ z2[animationProgress] ],
                        type: 'scatter',
                        mode: "markers",
                        marker: {color: 'black',
                        size: 20,
                        opacity: 0.7}
                    },
                    {
                        x: z1,
                        y: z2,
                        type: 'scatter',
                        mode: "lines",
                        line: {color: 'black',
                        size: 4,
                        opacity: 0.7}
                    },
                ]

            Plotly.react(foregroundPlot.current, data, layout, config)
        } else {
            Plotly.react(foregroundPlot.current, [], layout, config)
        }

    }, [animation2DData, animationProgress])


    function plots(state) {
        switch(state) {
        //     case 0:
        //         return <ScatterPlot
        //             id="scatterback"
        //             opacity={1}
        //             className={classes.background}
        //             data={scatterPoints}
        //             colors={colors}
        //             xrange={domain[0]}
        //             yrange={domain[1]}/>
            case 1:
                return <DensityPlot
                    className={classes.background}
                    data={scatterPoints}
                    colors={colors}
                    xrange={domain[0]}
                    yrange={domain[1]}/>
            default:
                return ""
        }
    }

    return (
            <div>
                <Paper className={classes.root}>
                    <ScatterPlot
                        id="scatterback"
                        opacity={tabState === 0 ? 1.0 : 0.0}
                        className={classes.background}
                        data={scatterPoints}
                        colors={colors}
                        xrange={domain[0]}
                        yrange={domain[1]}/>

                    {/* <div className={classes.background} id="scatterback"/> */}
                    { plots(tabState) }

                    <SkeletonGrid
                        className={classes.background}
                        data={skeletonGrid}
                        xrange={domain[0]}
                        yrange={domain[1]}/>

                    {/* { plotsOpacity(tabState) }
                    {/* <div className={classes.background} id="scatterfront"/> */}
                    <ScatterPlot
                        id="scatterfront"
                        opacity={0}
                        className={classes.background}
                        data={scatterPoints}
                        colors={colors}
                        xrange={domain[0]}
                        yrange={domain[1]}/>
                    
                    <BaryCenter
                        className={classes.background}
                        data={barycenters}
                        colors={colors}
                        xrange={domain[0]}
                        yrange={domain[1]}/>

                    <div id="foreground"
                        className={classes.foreground}
                        ref={foregroundPlot}/>


                </Paper>

                {/* <Card style={{
                    position: 'absolute',
                    pointerEvents:"none",
                    visibility: playAnimation ? "visible": 'hidden',
                    top: 50, left: 50 }}
                    elevation={4}
                    >
                    <CardContent>
                        { playAnimation && animation2DData ? animation2DData.desc: ""}
                    </CardContent>
                </Card> */}
            <Paper square>
                <Tabs value={tabState} onChange={(evt, newValue) => setTabState(newValue)}>
                    <Tab label="Scatter"/>
                    <Tab label="Density"/>
                    <Tab label="Clear"/>
                </Tabs>
            </Paper>
            </div>
            
    )
}