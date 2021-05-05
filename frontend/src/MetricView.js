import React, { Fragment, useRef, useEffect, useState } from 'react';
import { BASE_URL } from './config';
import Plotly from 'plotly.js-dist';
import * as d3 from 'd3';

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
export default function MetricView(props) {
    const { referentSelections, configID, colors, styles, className } = props;
    const ref = useRef(null);
    
    const [ data, setData ] = useState(EMPTY_DATA);

    const layout = {
        showlegend: false,
        paper_bgcolor: '#00000000',
        plot_bgcolor: '#00000000',
        title: {text: 'Variance Around AVG. Sequence', font: {size: 11}},
        yaxis: { tickfont: { size: 8 }},
        xaxis: {tickangle: 75, tickfont: {size: 12}},
        margin: {t: 24, l:16, r:48, b: 150, pad: 0}
    }

    useEffect(()=> {
        Plotly.newPlot(ref.current, [], layout, {})
    }, [])

    useEffect(() => {
        let requests =  Object.entries(referentSelections)
            .filter(item => item[1])
            .map(item => fetch_metric_data(item[0], configID))

        Promise.all(requests)
            .then(json => setData(json))
    }, [ referentSelections ])

    useEffect(() => {
        if (data !== undefined) {
            let plotData = data.map((item, idx) => ({
                x: [item.referent],
                y: [d3.sum(item.dist.map(i => i * i)) / item.dist.length],
                marker: { color: colors[item.referent]},
                name: item.referent,
                type: 'bar',
                opacity: 0.6
            }))

            Plotly.react(ref.current, plotData, layout);
        }
    }, [ data, colors ])

    return (
        <Fragment>
            <div className={className} ref={ref} styles={{...styles}}/>
        </Fragment>
    )
}