import React, {useEffect, useRef} from 'react';
import Plotly from 'plotly.js-dist';

function parse_scatter_points(scatter_points, colors) {
    let hist_data = new Map()
    
    for (let i = 0; i < scatter_points.data.length; i++) {
        let seq = scatter_points.data[i];
        let hist_group_data = hist_data.get(seq.GestureType);

        if (hist_group_data === undefined) {
            hist_group_data = {
                x: [],
                y: [],
                type: 'histogram2dcontour',
                ncontours: 3,
                histnorm: 'probability density',
                colorscale: [[0.0, "#FFFFFF00"], [1, colors[seq.GestureType]]],
                contours: {
                    start:0,
                    coloring: 'fill',
                    showlines: true,
                    operation: '>='
                    
                },
                line: {
                    width: 2
                },
                showscale: false,
                hovermode: false,
                opacity: 0.8
            }

            // scatter_group_data = {
            //     name: `Participant ${seq.ParticipantID}`,
            //     text: `Trial ${seq.TrialID}`,
            //     x: [],
            //     y: [],
            //     mode: 'markers',
            //     marker: {
            //         size: 3,
            //         color: colors[seq.GestureType]
            //     },
            //     type: 'scattergl',
            //     customdata: [],
            //     opacity: 0.00,
            //     hoverinfo: "x+y"
            // }
        }

        hist_group_data.x.push(...seq.z1)
        hist_group_data.y.push(...seq.z2)

        // scatter_group_data.x = hist_group_data.x
        // scatter_group_data.y = hist_group_data.y
        // scatter_group_data.customdata.push(...seq.Index)

        hist_data.set(seq.GestureType, hist_group_data)
        // scatter_data.set(seq.GestureType, scatter_group_data)
    }

    return [
        // ...scatter_data.values(),
        ...hist_data.values(),
    ]
}

export default function DensityPlot(props) {
    const densityPlot = useRef(null);

    const { data, colors, xrange, yrange, className } = props

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

    let config = {
        toImageButtonOptions: {
            format: 'svg', // one of png, svg, jpeg, webp
            filename: 'custom_image',
            height: 1024,
            width: 1024,
            scale: 1 // Multiply title/legend/axis/canvas sizes by this factor
          }
    }

    useEffect(() => {
        console.log('Init Density Plot');
        Plotly.newPlot(densityPlot.current, [], layout, config);
      }, [])

    useEffect(() => {
        console.log('Update Density Plot', data, minX, maxX, minY, maxY)
        Plotly.react(densityPlot.current, parse_scatter_points(data, colors), layout, config)
    }, [data, minX, maxX, minY, maxY])

    return  <div id="densityPlot" className={className} ref={densityPlot} style={props.style}/>
}