import React from 'react';
import Plotly from 'plotly.js-dist';
import { useLayoutEffect } from 'react';

function parse_scatter_points(scatter_points, colors, opacity) {
    let scatter_data = new Map()
    
    for (let i = 0; i < scatter_points.data.length; i++) {
        let seq = scatter_points.data[i];
        let scatter_group_data = scatter_data.get(`${seq.GestureType}${seq.ParticipantID}${seq.TrialID}`);

        if (scatter_group_data === undefined) {
            scatter_group_data = {
                name: `Participant ${seq.ParticipantID}`,
                text: `${seq.GestureType} - PID:${seq.ParticipantID} - TID:${seq.TrialID}`,
                x: [],
                y: [],
                mode: 'markers',
                marker: {
                    size: 2,
                    color: colors[seq.GestureType],
                },
                type: 'scattergl',
                customdata: [],
                opacity: opacity,
                hoverinfo: "x+y+text"
            }
        }

        scatter_group_data.x.push(...seq.z1)
        scatter_group_data.y.push(...seq.z2)
        scatter_group_data.customdata.push(...seq.Index)

        scatter_data.set(`${seq.GestureType}${seq.ParticipantID}${seq.TrialID}`, scatter_group_data)
    }
    return [...scatter_data.values()]
}

export default function ScatterPlot(props) {
    const {  data, colors, xrange, yrange, className, opacity, id } = props
    const [minX, maxX ] = xrange;
    const [minY, maxY ] = yrange;

    let layout = {
        showlegend: false,
        margin: {
            t: 0, b: 0, l: 0, r: 0, padding: 0
        },
        hovermode: 'closest',
        paper_bgcolor: '#00000000',
        plot_bgcolor: '#00000000',
        xaxis: {
            range: [minX, maxX],
            showgrid: false,
            zeroline: false,
        },
        yaxis: {
            range: [minY, maxY],
            showgrid: false,
            zeroline: false,
        }
    }

    useLayoutEffect(() => {
        console.log('Update Scatter Plot',  data, minX, maxX, minY, maxY)
        let parsed_data = parse_scatter_points(data, colors, opacity)

        Plotly.react(id, parsed_data, layout)

        let node = document.getElementById(id);
        node.on('plotly_click', console.log)


    }, [data, minX, maxX, minY, maxY, opacity])

    return  <div className={className} id={id}/>

}