import React, { useEffect, useRef } from "react";
import Plotly from 'plotly.js-dist';
import { useMemo } from "react";

function parse_skeleton_grid(grid) {
    return grid.map(
        item => item.skeleton.map(
            (skeleton_path, idx) => { 
                return {
                    x: skeleton_path.z1_dim,
                    y: skeleton_path.z2_dim,
                    hoverinfo: 'skip',
                    mode: 'lines+markers',
                    type: 'scatter',
                    line: {
                        width: 1,
                        color: 'black'
                    },
                    marker: {
                        size:   idx === 0 ? [5, 0, 0, 0, 0]: 2,
                        color: 'black'
                    },
                } 
            }
    )).flat()
}

export default function SkeletonGrid(props) {
    const skeletonPlot = useRef(null);
    const [minX, maxX] = props.xrange;
    const [minY, maxY] = props.yrange;

    const { data, className } = props;

    // Init Plot
    useEffect(() => {
        console.log('Init Skeleton Grid Plot.')
        Plotly.react(skeletonPlot.current, [], {responsive: true})

    }, [])

    // Update plot on new data
    useEffect(() => {
        console.info('Update SkeletonGrid', data, minX, maxX, minY, maxY);
        
        const layout = {
            showlegend: false,
            margin: {
                t: 0, b: 0, l: 0, r: 0, padding: 0
            },
            hoverinfo: 'none',
            paper_bgcolor: '#00000000',
            plot_bgcolor: '#00000000',
            xaxis: {
                range: [minX, maxX],
                showgrid: true,
                zeroline: false,
            },
            yaxis: {
                range: [minY, maxY],
                showgrid: true,
                zeroline: false
            }

        };
        const config = {
            staticPlot: true,
            responsive: true,
        };

        let new_data = parse_skeleton_grid(data);
        Plotly.react(skeletonPlot.current, new_data, layout, config)
    }, [data, minX, maxX, minY, maxY])

    return <div id="skeletonGrid" className={className} ref={skeletonPlot} style={props.style}/>
}