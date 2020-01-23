import React, { CSSProperties } from 'react';
import { WebGLTimeRange, WebGLValueRange } from './webglChartStore';

interface Props
{
    readonly timeViewport: WebGLTimeRange;
    readonly valueViewport: WebGLValueRange;
    readonly timeSelect: WebGLTimeRange;
    readonly valueSelect: WebGLValueRange;
}

export default class WebGLChartSelection extends React.PureComponent<Props>
{
    public render()
    {
        const { valueViewport, timeViewport, timeSelect, valueSelect } = this.props;
        if (timeSelect == null || valueSelect == null)
        {
            return null;
        }

        const timeWidth = timeViewport.maxTime - timeViewport.minTime;
        const height = valueViewport.maxValue - valueViewport.minValue;

        const percentMinX = (timeSelect.minTime - timeViewport.minTime) / timeWidth;
        const percentMaxX = (timeSelect.maxTime - timeViewport.minTime) / timeWidth;

        const percentMinY = (valueSelect.minValue - valueViewport.minValue) / height;
        const percentMaxY = (valueSelect.maxValue - valueViewport.minValue) / height;

        const selectWidth = percentMaxX - percentMinX;
        const selectHeight = percentMaxY - percentMinY;

        const style: CSSProperties = {
            left: `${percentMinX * 100}%`,
            width: `${selectWidth * 100}%`,

            top: `${(1 - percentMaxY) * 100}%`,
            height: `${selectHeight * 100}%`
        }

        return <div className='webgl-chart__selection' style={style} />;
    }
}