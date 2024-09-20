import pandas as pd

# 删除这行: import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from statsmodels.tsa.arima.model import ARIMA


def load_data(file):
    """加载数据文件"""
    return pd.read_csv(file)


def clean_data(data):
    """清理数据"""
    # 删除重复行
    data = data.drop_duplicates()
    # 处理缺失值
    data = data.fillna(data.mean())
    return data


def process_data(data):
    """处理数据"""
    # 这里可以添加更多的数据处理步骤
    return data.to_dict(orient="records")


def get_preview(data, rows=5):
    """获取数据预览"""
    return data.head(rows).to_dict(orient="records")


def perform_regression(data, x_columns, y_column):
    """执行回归分析"""
    X = data[x_columns]
    y = data[y_column]

    model = LinearRegression()
    model.fit(X, y)

    coefficients = dict(zip(x_columns, model.coef_))
    intercept = model.intercept_
    r_squared = model.score(X, y)

    return {
        "coefficients": coefficients,
        "intercept": intercept,
        "r_squared": r_squared,
    }


def perform_time_series_analysis(data, column, periods=1):
    """执行时间序列分析"""
    series = data[column]
    model = ARIMA(series, order=(1, 1, 1))
    results = model.fit()

    forecast = results.forecast(steps=periods)
    return {
        "forecast": forecast.tolist(),
        "confidence_interval": results.conf_int(alpha=0.05).tolist(),
    }


def group_and_aggregate(data, group_by, agg_column, agg_func):
    """分组和聚合数据"""
    grouped = data.groupby(group_by)
    if agg_func == "mean":
        result = grouped[agg_column].mean()
    elif agg_func == "sum":
        result = grouped[agg_column].sum()
    elif agg_func == "count":
        result = grouped[agg_column].count()
    else:
        raise ValueError(f"不支持的聚合函数: {agg_func}")

    return result.to_dict()


def preprocess_data(data, method, columns):
    """预处理数据"""
    if method == "standardize":
        scaler = StandardScaler()
        data[columns] = scaler.fit_transform(data[columns])
    elif method == "normalize":
        data[columns] = (data[columns] - data[columns].min()) / (
            data[columns].max() - data[columns].min()
        )
    else:
        raise ValueError(f"不支持的预处理方法: {method}")

    return data
