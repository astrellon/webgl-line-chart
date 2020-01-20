import { Modifier } from 'simple-data-store';

export interface WebGLViewport
{
    readonly minTime: number;
    readonly maxTime: number;
    readonly minValue: number;
    readonly maxValue: number;
}

export interface WebGLTimeSelection
{
    readonly minTime: number;
    readonly maxTime: number;
}
export interface WebGLValueSelection
{
    readonly minValue: number;
    readonly maxValue: number;
}

export interface WebGLChartState
{
    readonly dataSeries: WebGLDataSeries[];
    readonly viewport: WebGLViewport;
    readonly id: string;
}

export interface WebGLDataSeries
{
    readonly data: number[];
    readonly type: 'line' | 'minmax';
    readonly colour: number[];
    readonly startTime: number;
    readonly sqs: number;
}

export interface WebGLChartIdToState { readonly [id: string]: WebGLChartState }
export interface WebGLChartsState
{
    readonly charts: WebGLChartIdToState;
    readonly timeSelections: { [timeSelectId: string]: WebGLTimeSelection };
    readonly valueSelections: { [valueSelectId: string]: WebGLValueSelection };
}

export interface State
{
    readonly webglChartState: WebGLChartsState;
}

function modifyWebGL(state: State, webglChartState: Partial<WebGLChartsState>): Partial<State>
{
    return {webglChartState: Object.assign({}, state.webglChartState, webglChartState)}
}

function calculateViewportForAll(dataSeries: WebGLDataSeries[])
{
    let minValue = Number.MAX_VALUE;
    let maxValue = Number.MIN_VALUE;
    let minTime = Number.MAX_VALUE;
    let maxTime = Number.MIN_VALUE;

    for (let data of dataSeries)
    {
        const viewport = calculateViewport(data);
        minValue = Math.min(viewport.minValue, minValue);
        maxValue = Math.max(viewport.maxValue, maxValue);
        minTime = Math.min(viewport.minTime, minTime);
        maxTime = Math.max(viewport.maxTime, maxTime);
    }

    return { minValue, maxValue, minTime, maxTime }
}

function calculateViewport(dataSeries: WebGLDataSeries)
{
    let minValue = Number.MAX_VALUE;
    let maxValue = Number.MIN_VALUE;

    for (let v of dataSeries.data)
    {
        minValue = Math.min(v, minValue);
        maxValue = Math.max(v, maxValue);
    }

    let minTime = dataSeries.startTime;

    // Min Max data series are a combination of two data series with each value zipped together.
    let length = dataSeries.type === 'line' ? dataSeries.data.length : dataSeries.data.length * 0.5;
    let maxTime = dataSeries.startTime + dataSeries.sqs * length;

    return { minValue, maxValue, minTime, maxTime }
}

export default class WebGLChartStore
{
    public static setChartData(chartId: string, dataSeries: WebGLDataSeries[]): Modifier<State>
    {
        return (state: State) =>
        {
            const newCharts: WebGLChartIdToState =
            {
                ...state.webglChartState.charts,
            };

            let chartState = newCharts[chartId];
            if (!chartState)
            {
                const viewport = calculateViewportForAll(dataSeries);
                chartState =
                {
                    dataSeries: dataSeries,
                    viewport: viewport,
                    id: chartId
                }
            }
            else
            {
                chartState =
                {
                    ...chartState,
                    dataSeries: dataSeries
                }
            }

            // TODO Fix once have Editable
            (newCharts as any)[chartId] = chartState;

            return modifyWebGL(state,
            {
                charts: newCharts
            });
        }
    }

    public static resetViewport(chartId: string): Modifier<State>
    {
        return (state: State) =>
        {
            let chartState = state.webglChartState.charts[chartId];
            if (!chartState)
            {
                return null;
            }

            const newChartState =
            {
                ...chartState,
                viewport: calculateViewportForAll(chartState.dataSeries)
            }

            const newCharts =
            {
                ...state.webglChartState.charts,
                [chartId]: newChartState
            }

            return modifyWebGL(state, { charts: newCharts });
        }
    }
}