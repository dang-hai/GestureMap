import React, { Fragment } from 'react';
import { FormControlLabel, Switch, Button } from '@material-ui/core';


export default function BarycenterView(props) {

    const { barycenter, barycenterSelected } = props;

    function handleAnimateBarycenter() {
        props.handleAnimateBarycenter(barycenter);
    }

    function handleShowBarycenter() {
        props.handleShowBarycenter(barycenter);
    }

    return (
        <Fragment>
            <FormControlLabel
                control={<Switch checked={barycenterSelected} onChange={handleShowBarycenter}/>}
                label="Show Average Sequence"
                />
            <Button
                color="secondary" 
                variant="outlined" 
                style={{marginTop: 8}}
                onClick={handleAnimateBarycenter}>
                Animate Average Sequence
            </Button>
        </Fragment>
    )

}