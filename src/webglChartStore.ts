import { Modifier } from 'simple-data-store';

export interface WebGLTimeRange
{
    readonly minTime: number;
    readonly maxTime: number;
}
export interface WebGLValueRange
{
    readonly minValue: number;
    readonly maxValue: number;
}

export interface WebGLChartState
{
    readonly dataSeries: WebGLDataSeries[];
    readonly id: string;
    readonly timeSelectionId: string;
    readonly valueSelectionId: string;
}

export interface WebGLDataSeries
{
    readonly data: number[];
    readonly type: 'line' | 'minmax' | 'dots';
    readonly colour: number[];
    readonly startTime: number;
    readonly sqs: number;
    readonly pointSize: number;
}

export interface WebGLChartIdToState { readonly [id: string]: WebGLChartState }
export interface WebGLChartsState
{
    readonly charts: WebGLChartIdToState;
    readonly timeSelections: { [timeSelectId: string]: WebGLTimeRange };
    readonly valueSelections: { [valueSelectId: string]: WebGLValueRange };
    readonly timeViewports: { [timeSelectId: string]: WebGLTimeRange };
    readonly valueViewports: { [valueSelectId: string]: WebGLValueRange };
}

export interface State
{
    readonly webglChartState: WebGLChartsState;
}

function modifyWebGL(state: State, webglChartState: Partial<WebGLChartsState>): Partial<State>
{
    return {webglChartState: Object.assign({}, state.webglChartState, webglChartState)}
}

function modifyChartState(state: State, chartId: string, chartState: Partial<WebGLChartState>): Partial<State>
{
    const newCharts: WebGLChartIdToState =
    {
        ...state.webglChartState.charts,
    };

    // TODO Fix once have Editable
    (newCharts as any)[chartId] = {...newCharts[chartId], ...chartState};

    return modifyWebGL(state,
    {
        charts: newCharts
    });
}

function modifyTimeViewport(state: State, viewportId: string, timeViewport: WebGLTimeRange): Partial<State>
{
    return modifyWebGL(state,
    {
        timeViewports: {
            ...state.webglChartState.timeViewports,
            [viewportId]: timeViewport
        }
    });
}

function modifyValueViewport(state: State, viewportId: string, valueViewport: WebGLValueRange): Partial<State>
{
    return modifyWebGL(state,
    {
        valueViewports: {
            ...state.webglChartState.valueViewports,
            [viewportId]: valueViewport
        }
    });
}

function modifyTimeSelection(state: State, selectionId: string, timeSelection: WebGLTimeRange): Partial<State>
{
    return modifyWebGL(state,
    {
        timeSelections: {
            ...state.webglChartState.timeSelections,
            [selectionId]: timeSelection
        }
    });
}

function modifyValueSelection(state: State, selectionId: string, valueSelection: WebGLValueRange): Partial<State>
{
    return modifyWebGL(state,
    {
        valueSelections: {
            ...state.webglChartState.valueSelections,
            [selectionId]: valueSelection
        }
    });
}

function calculateValueRangeForAll(dataSeries: WebGLDataSeries[]): WebGLValueRange
{
    let minValue = Number.MAX_VALUE;
    let maxValue = Number.MIN_VALUE;

    for (let data of dataSeries)
    {
        const viewport = calculateValueRange(data);
        minValue = Math.min(viewport.minValue, minValue);
        maxValue = Math.max(viewport.maxValue, maxValue);
    }

    return { minValue, maxValue }
}

function calculateTimeRangeForAll(dataSeries: WebGLDataSeries[]): WebGLTimeRange
{
    let minTime = Number.MAX_VALUE;
    let maxTime = Number.MIN_VALUE;

    for (let data of dataSeries)
    {
        const viewport = calculateTimeRange(data);
        minTime = Math.min(viewport.minTime, minTime);
        maxTime = Math.max(viewport.maxTime, maxTime);
    }

    return { minTime, maxTime }
}

function calculateValueRange(dataSeries: WebGLDataSeries): WebGLValueRange
{
    let minValue = Number.MAX_VALUE;
    let maxValue = Number.MIN_VALUE;

    for (let v of dataSeries.data)
    {
        minValue = Math.min(v, minValue);
        maxValue = Math.max(v, maxValue);
    }

    return { minValue, maxValue }
}

function calculateTimeRange(dataSeries: WebGLDataSeries): WebGLTimeRange
{
    const minTime = dataSeries.startTime;

    // Min Max data series are a combination of two data series with each value zipped together.
    const length = dataSeries.type === 'line' ? dataSeries.data.length : dataSeries.data.length * 0.5;
    const maxTime = dataSeries.startTime + dataSeries.sqs * length;

    return { minTime, maxTime }
}

export default class WebGLChartStore
{
    public static setChartData(chartId: string, dataSeries: WebGLDataSeries[]): Modifier<State>
    {
        return (state: State) =>
        {
            let chartState = state.webglChartState.charts[chartId];
            let valueViewports = state.webglChartState.valueViewports;
            let timeViewports = state.webglChartState.timeViewports;

            if (!chartState)
            {
                chartState =
                {
                    dataSeries: dataSeries,
                    id: chartId,
                    timeSelectionId: chartId,
                    valueSelectionId: chartId
                }

                const valueViewport = calculateValueRangeForAll(dataSeries);
                const timeViewport = calculateTimeRangeForAll(dataSeries);

                valueViewports = {
                    ...valueViewports,
                    [chartState.valueSelectionId]: valueViewport
                }
                timeViewports = {
                    ...timeViewports,
                    [chartState.timeSelectionId]: timeViewport
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

            return modifyWebGL(state, {
                charts: {
                    ...state.webglChartState.charts,
                    [chartId]: chartState
                },
                valueViewports,
                timeViewports
            })
        }
    }

    public static resetTimeViewport(chartId: string, timeViewportId: string): Modifier<State>
    {
        return (state: State) =>
        {
            let chartState = state.webglChartState.charts[chartId];
            if (!chartState)
            {
                return state;
            }

            const viewport = calculateTimeRangeForAll(chartState.dataSeries);
            return modifyTimeViewport(state, timeViewportId, viewport);
        }
    }

    public static resetValueViewport(chartId: string, valueViewportId: string): Modifier<State>
    {
        return (state: State) =>
        {
            let chartState = state.webglChartState.charts[chartId];
            if (!chartState)
            {
                return state;
            }

            const viewport = calculateValueRangeForAll(chartState.dataSeries);
            return modifyValueViewport(state, valueViewportId, viewport);
        }
    }

    public static setTimeSelection(timeSelectionId: string, timeSelection: WebGLTimeRange): Modifier<State>
    {
        return (state: State) => modifyTimeSelection(state, timeSelectionId, timeSelection);
    }

    public static setValueSelection(valueSelectionId: string, valueSelection: WebGLValueRange): Modifier<State>
    {
        return (state: State) => modifyValueSelection(state, valueSelectionId, valueSelection);
    }

    public static setTimeViewport(timeViewportId: string, timeViewport: WebGLTimeRange): Modifier<State>
    {
        return (state: State) => modifyTimeViewport(state, timeViewportId, timeViewport);
    }

    public static setValueViewport(valueViewportId: string, valueViewport: WebGLValueRange): Modifier<State>
    {
        return (state: State) => modifyValueViewport(state, valueViewportId, valueViewport);
    }

    public static zoomValueViewport(valueViewportId: string, factor: number): Modifier<State>
    {
        return (state: State) =>
        {
            const viewport = state.webglChartState.valueViewports[valueViewportId];
            if (!viewport)
            {
                return state;
            }

            const newViewport = {
                maxValue: viewport.maxValue * factor,
                minValue: viewport.minValue * factor
            };

            return modifyValueViewport(state, valueViewportId, newViewport);
        }
    }

    public static zoomTimeViewport(timeViewportId: string, factor: number): Modifier<State>
    {
        return (state: State) =>
        {
            const viewport = state.webglChartState.timeViewports[timeViewportId];
            if (!viewport)
            {
                return state;
            }

            const middle = (viewport.maxTime + viewport.minTime) * 0.5;
            const diff = viewport.maxTime - middle;

            const newViewport = {
                maxTime: middle + diff * factor,
                minTime: middle - diff * factor
            }

            return modifyTimeViewport(state, timeViewportId, newViewport);
        }
    }
}