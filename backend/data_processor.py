import pandas as pd
import numpy as np
from scipy import stats
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.seasonal import seasonal_decompose
from sklearn.linear_model import LinearRegression

def load_data(file):
    """
    加载数据文件
    """
    return pd.read_csv(file)

def process_data(data):
    """
    处理数据
    """
    return {
        'raw_data': data.to_dict(orient='list'),
        'statistics': {
            'mean': data.mean().to_dict(),
            'median': data.median().to_dict(),
            'std': data.std().to_dict(),
            'correlation': data.corr().to_dict(),
            'skewness': data.skew().to_dict(),
            'kurtosis': data.kurtosis().to_dict()
        }
    }

def get_preview(data, rows=5):
    """
    获取数据预览
    """
    return data.head(rows).to_dict(orient='records')

def clean_data(data):
    """
    数据清洗
    """
    # 处理缺失值
    data_cleaned = data.dropna()
    
    # 异常值检测（使用Z-score方法）
    z_scores = np.abs(stats.zscore(data_cleaned.select_dtypes(include=[np.number])))
    data_cleaned = data_cleaned[(z_scores < 3).all(axis=1)]
    
    return data_cleaned

def perform_regression(data, x_columns, y_column):
    """
    执行多元回归
    """
    try:
        X = data[x_columns]
        y = data[y_column]
        model = LinearRegression().fit(X, y)
        return {
            'coefficients': dict(zip(x_columns, model.coef_)),
            'intercept': model.intercept_,
            'r_squared': model.score(X, y)
        }
    except Exception as e:
        raise ValueError(f"执行回归分析时出错: {str(e)}")

def perform_time_series_analysis(data, column, periods=1):
    """
    执行时间序列分析
    """
    try:
        # 假设数据已经按时间排序
        model = ARIMA(data[column], order=(1,1,1))
        results = model.fit()
        forecast = results.forecast(steps=periods)
        decomposition = seasonal_decompose(data[column], model='additive', period=12)
        return {
            'forecast': forecast.tolist(),
            'trend': decomposition.trend.dropna().tolist(),
            'seasonal': decomposition.seasonal.dropna().tolist(),
            'residual': decomposition.resid.dropna().tolist()
        }
    except Exception as e:
        raise ValueError(f"执行时间序列分析时出错: {str(e)}")

def group_and_aggregate(data, group_by, agg_column, agg_func):
    """
    数据分组和聚合
    """
    try:
        grouped = data.groupby(group_by)[agg_column].agg(agg_func)
        return grouped.to_dict()
    except Exception as e:
        raise ValueError(f"执行数据分组和聚合时出错: {str(e)}")

def preprocess_data(data, method, columns):
    """
    数据预处理
    """
    try:
        if method == 'standardize':
            scaler = StandardScaler()
        elif method == 'normalize':
            scaler = MinMaxScaler()
        else:
            raise ValueError("不支持的预处理方法")
        
        data[columns] = scaler.fit_transform(data[columns])
        return data
    except Exception as e:
        raise ValueError(f"执行数据预处理时出错: {str(e)}")

# 可以根据需要添加更多函数