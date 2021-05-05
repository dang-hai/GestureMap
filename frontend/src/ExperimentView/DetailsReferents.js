import React , { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';

import Box from '@material-ui/core/Box';

import TableCell from '@material-ui/core/TableCell';

import TableRow from '@material-ui/core/TableRow';
import IconButton from '@material-ui/core/IconButton';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import Checkbox from '@material-ui/core/Checkbox';

import { Typography } from '@material-ui/core';



export default function DetailsReferents(props) {
    const {
        expanded,
        referent,
        colors,
        referentSelections,
    } = props;
    
    const [ handleReferentSelection ] = useState(() => props.handleReferentSelection);
    const [ handleExpand ] = useState(() => props.handleExpand);

    const ColoredCheckbox = withStyles({
        root: {
            color: colors[referent],
            '&$checked': {
                color: colors[referent],
            },
        },
        checked: {},
    })(Checkbox);

    return (
        <React.Fragment>
            {/* Row: Referent Details */}
            <TableRow key={`${referent}-head`}>

                {/* Expand Icon */}
                <TableCell size="small">
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={(evt) => handleExpand(referent)}>
                        {expanded[referent] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
               
                {/* Selection Checkbox */}
                <TableCell size="small">
                    <ColoredCheckbox
                        size="small"
                        checked={referentSelections[referent]}
                        onChange={(evt, newVal) => {
                            if (newVal === false && expanded[referent] === true) {
                                handleExpand(referent)
                            }

                            handleReferentSelection(referent, newVal)
                            }}/>
                </TableCell>

                <TableCell size="small">
                    <Typography variant="caption" style={{fontSize: 10}}>
                    {/* { (trialData.length > 0) ? 
                        trialData.map(d => `RID${d.GestureType}PID${d.ParticipantID}TID${d.TrialID}]`)
                        .map(key => trialSelections[key] ? trialSelections[key].checked : false)
                        .reduce((a, b) => a + b, 0)
                        : 0
                    } Selected */}
                    </Typography>
                </TableCell>

                {/* Referent Name */}
                <TableCell size="small" component="th" scope="row">
                    <Typography variant="caption" style={{fontSize: 12}}>
                        {referent}
                    </Typography>
                </TableCell>

            </TableRow>

            {/* Hidden Concent: Gesture Proposals */}
            <TableRow key={`${referent}-data`}>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0}} colSpan={4}>
                    <Box style={{margin: 8}}>
                       { props.children }
                    </Box>
                </TableCell>
            </TableRow>
        </React.Fragment>
    )
}