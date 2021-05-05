import React , {useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist';

export default function BaryCenter(props) {
    const plot = useRef(null);

    const { className } = props;

    const [minX, maxX] = props.xrange;
    const [minY, maxY] = props.yrange;
    const colors = props.colors;
    const barycenters = props.data;

    const layout =  {
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
            zeroline: false
        },
        yaxis: {
            range: [minY, maxY],
            showgrid: false,
            zeroline: false
        }
    };

    const config = {}

    // useEffect(() => {
    //     console.log('Init Barycenter Plot.')
    //     Plotly.react(plot.current, [], layout, config);
    // }, [])
    
    useEffect(() => {
        console.log('Update Barycenter Plot',  barycenters, minX, maxX, minY, maxY)

        let plotData = [
            ...barycenters.map((item) => (
            {
                x: item.z1,
                y: item.z2,
                mode: 'lines+markers',
                type: "scatter",
                line : { color: colors[item.Referent], width: 5},
                opacity: 0.7
            }
            
            )),
        ];

        Plotly.react(plot.current, plotData, layout, config)
    }, [barycenters, minX, maxX, minY, maxY]);

    

    return (
        <div id="barycenterPlot" className={className} ref={plot} style={props.style}></div>
    )
}