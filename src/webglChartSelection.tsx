import React, { CSSProperties } from 'react';
import { WebGLTimeRange, WebGLValueRange } from './webglChartStore';

interface Props
{
    readonly timeViewport?: WebGLTimeRange;
    readonly valueViewport?: WebGLValueRange;
    readonly timeSelect?: WebGLTimeRange;
    readonly valueSelect?: WebGLValueRange;

    readonly enableTimeSelect: boolean;
    readonly enableValueSelect: boolean;
}

export default class WebGLChartSelection extends React.PureComponent<Props>
{
    public render()
    {
        const { enableTimeSelect, enableValueSelect, valueViewport, timeViewport } = this.props;
        if ((enableTimeSelect && this.props.timeSelect == null) && (enableValueSelect && this.props.valueSelect == null))
        {
            return null;
        }

        const timeSelect = this.props.timeSelect || timeViewport;
        const valueSelect = this.props.valueSelect || valueViewport;

        let percentMinX = 0;
        let percentMaxX = 1;

        if (enableTimeSelect)
        {
            const timeWidth = timeViewport.maxTime - timeViewport.minTime;
            percentMinX = (timeSelect.minTime - timeViewport.minTime) / timeWidth;
            percentMaxX = (timeSelect.maxTime - timeViewport.minTime) / timeWidth;
        }

        let percentMinY = 0;
        let percentMaxY = 1;

        if (enableValueSelect)
        {
            const height = valueViewport.maxValue - valueViewport.minValue;
            percentMinY = (valueSelect.minValue - valueViewport.minValue) / height;
            percentMaxY = (valueSelect.maxValue - valueViewport.minValue) / height;
        }

        percentMinX = Math.max(0, percentMinX);
        percentMinY = Math.max(0, percentMinY);
        percentMaxX = Math.min(1, percentMaxX);
        percentMaxY = Math.min(1, percentMaxY);

        if (percentMaxX >= 1 && percentMaxY >= 1 && percentMinY <= 0 && percentMinX <= 0)
        {
            return null;
        }

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