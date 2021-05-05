import React, { Fragment, useRef, useEffect, useState } from 'react';

import Plotly from 'plotly.js-dist';
import * as d3 from 'd3';
import { BASE_URL } from './config';


function fetch_metric_data(referent, configID) {
    return fetch(`${BASE_URL}/api/data/d2b`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({'referent': referent, 'configID': configID})
    })
    .then(res => res.json())
    .catch(console.error)
}

const EMPTY_DATA = [];
export default function ViolinPlot(props) {
    const { referentSelections, configID, colors, className } = props;
    const ref = useRef(null);
    
    const [ data, setData ] = useState(EMPTY_DATA);

    const layout = {
        height: 365,
        paper_bgcolor: '#00000000',
        plot_bgcolor: '#00000000',
        showlegend: false,
        title: {text: 'Median DTW Distance to Barycenter', font: {size: 11}},
        xaxis: {tickangle: 90, tickfont: {size: 8}},
        margin: {t: 48, l: 16, r:0, pad: 0}
    }

    useEffect(()=> {
        Plotly.newPlot(ref.current, [], layout, {});
    }, [])

    useEffect(() => {
        console.log('Fetch metric data', referentSelections)
        let requests =  Object.entries(referentSelections)
            .filter(item => item[1])
            .map(item => fetch_metric_data(item[0], configID))

        Promise.all(requests)
            .then(json => setData(json))
    }, [ referentSelections ])

    useEffect(() => {
        console.log('Update Violin Plot', data, colors);

        if (data.length > 0) {
            let plotData = data.map((item, idx) => ({
                x: [item.referent],
                y: [d3.mean(item.dist)],
                fillcolor: colors[item.referent],
                name: item.referent,
                type: 'bar',
                line: {
                    color: 'black'
                  },
                marker: { color: colors[item.referent]},
                box: {
                    visible: true
                  },
                boxpoints: false,
                opacity: 0.6,
                meanline: {
                    visible: true
                },
            }))

            Plotly.react(ref.current, plotData, layout);
        }
    }, [ data, colors ])

    return (
        <Fragment>
            <div ref={ref} className={className}/>
        </Fragment>
    )
}