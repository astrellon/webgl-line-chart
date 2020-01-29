import React from 'react';
import ReactDOM from 'react-dom';
import DataStore from "simple-data-store";
import WebGLChartStore, { State, WebGLChartState, WebGLDataSeries, WebGLTimeRange, WebGLValueRange } from "./webglChartStore";
import WebGLChart, { WebGLSelectionState, TimeValuePair } from './webglChart';
import WebGLChartPreview from './webglChartPreview';

const rootEl = document.getElementById('root');
const store = new DataStore<State>({
    webglChartState: {
        charts: {},
        timeSelections: {},
        valueSelections: {},
        timeViewports: {},
        valueViewports: {}
    }
});

function createSineWave(nPoints: number, xOffset: number, yOffset: number, amplitude: number): number[]
{
    const meshData = new Array<number>(nPoints);
    for (let x = 0, i = 0; x < nPoints; x++, i++)
    {
        const normX = (x / nPoints) * 8 - 4;
        const normY = Math.sin(normX * 10 + xOffset) * amplitude + yOffset + Math.random() * 0.2 - 0.1;
        meshData[i] = normY;
    }
    return meshData;
}

function createMinMaxMesh(startTime: number, top: number[], bottom: number[], colour: number[]): WebGLDataSeries
{
    if (top.length !== bottom.length)
    {
        throw new Error('Must be same leave to create min max mesh');
    }

    const result = new Array<number>(top.length * 2);

    for (let i = 0, j = 0; i < top.length; i++)
    {
        result[j++] = top[i];
        result[j++] = bottom[i];
    }

    return {
        colour,
        startTime,
        sqs: 1 / top.length,
        type: 'minmax',
        data: result,
        pointSize: 1
    }
}

function createLineMesh(startTime: number, data: number[], colour: number[], isDots: boolean, pointSize: number = 1): WebGLDataSeries
{
    return {
        colour,
        startTime,
        data,
        sqs: 1 / data.length,
        type: isDots ? 'dots' : 'line',
        pointSize
    }
}

const top = createSineWave(500, 0, 2, 1);
const bottom = createSineWave(500, 1, -2, 1.1);
const middle = createSineWave(500, 0.5, 0, 0.5);

const minmaxMesh = createMinMaxMesh(50, top, bottom, [1, 0, 0, 0.5]);
const middleMesh = createLineMesh(50, middle, [1, 0, 0, 1], false);
const middleDotsMesh = createLineMesh(50, middle, [1, 0, 0, 1], true, 10);

store.execute(WebGLChartStore.setChartData('chart1', [
    minmaxMesh, middleDotsMesh, middleMesh
]));
store.execute(WebGLChartStore.setChartData('chart2', [
    minmaxMesh, middleDotsMesh, middleMesh
], true, false, null, 'chart1'));

function render(state: State)
{
    const webglState = state.webglChartState;
    const chart1 = webglState.charts['chart1'];

    ReactDOM.render(<div>
        <h1>WebGL React</h1>
        { Object.values(webglState.charts).map((chartState: WebGLChartState) =>
            {
                const timeSelection = webglState.timeSelections[chartState.timeSelectionId];
                const valueSelection = webglState.valueSelections[chartState.valueSelectionId];
                const timeViewports = webglState.timeViewports[chartState.timeSelectionId];
                const valueViewports = webglState.valueViewports[chartState.valueSelectionId];

                return <WebGLChart key={chartState.id} chartState={chartState}
                    timeSelection={timeSelection} valueSelection={valueSelection}
                    timeViewport={timeViewports} valueViewport={valueViewports}
                    onTimeSelect={onChartTimeSelect}
                    onValueSelect={onChartValueSelect}
                    onResetTimeViewport={onChartResetTimeZoom}
                    onResetValueViewport={onChartResetValueZoom}
                    />
            }
        )}

            <WebGLChartPreview chartState={chart1}
                onTimeSelect={onChartTimeSelect}
                timeSelection={webglState.timeSelections[chart1.timeSelectionId]}
                timeViewport={webglState.timeViewports[chart1.timeSelectionId]}
                valueSelection={webglState.valueSelections[chart1.valueSelectionId]}
                valueViewport={webglState.valueViewports[chart1.valueSelectionId]}
                />
    </div>, rootEl);
}

function onChartResetTimeZoom(chartId: string, timeViewportId: string)
{
    store.execute(WebGLChartStore.resetTimeViewport(chartId, timeViewportId))
}

function onChartResetValueZoom(chartId: string, valueViewportId: string)
{
    store.execute(WebGLChartStore.resetValueViewport(chartId, valueViewportId))
}

function onChartTimeSelect(timeSelectionId: string, selectState: WebGLSelectionState, timeSelect: WebGLTimeRange)
{
    if (selectState === 'done')
    {
        store.execute(WebGLChartStore.setTimeSelection(timeSelectionId, null));
        store.execute(WebGLChartStore.setTimeViewport(timeSelectionId, timeSelect));
    }
    else if (selectState === 'in-progress')
    {
        store.execute(WebGLChartStore.setTimeSelection(timeSelectionId, timeSelect));
    }
    else
    {
        store.execute(WebGLChartStore.setTimeSelection(timeSelectionId, null));
    }
}

function onChartValueSelect(valueSelectionId: string, selectState: WebGLSelectionState, valueSelect: WebGLValueRange)
{
    if (selectState === 'done')
    {
        store.execute(WebGLChartStore.setValueSelection(valueSelectionId, null));
        store.execute(WebGLChartStore.setValueViewport(valueSelectionId, valueSelect));
    }
    else if (selectState === 'in-progress')
    {
        store.execute(WebGLChartStore.setValueSelection(valueSelectionId, valueSelect));
    }
    else
    {
        store.execute(WebGLChartStore.setValueSelection(valueSelectionId, null));
    }
}

render(store.state());
store.subscribeAny((state: State) =>
{
    render(state);
});

rootEl.addEventListener('wheel', (e) =>
{
    if (e.deltaY > 0)
    {
        store.execute(WebGLChartStore.zoomTimeViewport('chart1', 0.9));
    }
    else if (e.deltaY < 0)
    {
        store.execute(WebGLChartStore.zoomTimeViewport('chart1', 1.1));
    }
})