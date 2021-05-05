import { useState, useEffect } from 'react';

const DEFAULT_EMPTY_COLORMAPPING = {};
export function useColors(gesture_types) {
    const [colorMapping, setColorMapping ] = useState(DEFAULT_EMPTY_COLORMAPPING)

    useEffect(() => {
        const colors = [
            '#3cb44b',
            '#4363d8',
            '#f032e6',
            '#f58231',
            '#e6194b',
            '#3cb44b',
            '#ffe119',
            '#4363d8',
            '#f58231',
            '#911eb4',
            '#46f0f0',
            '#f032e6',
            '#bcf60c',
            '#fabebe',
            '#008080',
            '#e6beff',
            '#9a6324',
            '#fffac8',
            '#800000',
            '#aaffc3',
            '#808000',
            '#ffd8b1',
            '#000075',
            '#808080',
            '#ffffff',
            '#000000'
        ];

        let new_mapping = {};

        for (let i in gesture_types.data) {
            let gt = gesture_types.data[i].GestureType;
            new_mapping[gt] = colors[i % colors.length];
        }

        setColorMapping(new_mapping);

    }, [gesture_types])

    return colorMapping
}

const DEFAULT_REFERENT_SELECTIONS = {}
export function useReferentSelections(referents) {
    const [referentSelections, setReferentSelections] = useState(DEFAULT_REFERENT_SELECTIONS);

    useEffect(() => {
        console.log('Init Referent Selection');
        if (referents.data.length === 0) {
            console.log('Init Referent Selection Aborted! Waiting for cr data to load...');
            return           
        }

        let init = referents.data.map(
            (item, idx) => (idx < 4) ? 
                [item.GestureType, true] : [item.GestureType, false]
        );

        setReferentSelections(prev => ({...Object.fromEntries(init), ...prev}));
    }, [referents])

    return [referentSelections, setReferentSelections]
}
    

const DEFAULT_TRIAL_SELECTIONS = {}
export function useTrialSelections(trialValues) {
    const [selectedTrialData, setSelectedTrialData] = useState(DEFAULT_TRIAL_SELECTIONS);
    
    useEffect(() => {
        console.log('useSelectedTrialData', trialValues)

        let vals = trialValues.data.map(item => [`RID${item.GestureType}PID${item.ParticipantID}TID${item.TrialID}`, item])
        
        setSelectedTrialData(prev => {
            let updated = vals.map(item => {
                let [key, updated_entries ] = item;
                let prev_entries = prev[key];
                return [key, {
                    ...prev_entries,
                    ...updated_entries,
                    checked: false}]
            })
            return Object.fromEntries(updated)
        })

    }, [ trialValues ])

    return [selectedTrialData, setSelectedTrialData]
}