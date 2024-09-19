from flask import Flask, jsonify, request, abort
from flask_cors import CORS
from data_processor import (
    load_data, process_data, get_preview, clean_data, perform_regression,
    perform_time_series_analysis, group_and_aggregate, preprocess_data
)
from visualizer import (
    create_histogram, create_scatter_plot, create_line_plot, create_pie_chart,
    create_box_plot, create_heatmap, create_scatter_matrix, create_tree_map, create_dendrogram
)
import io
import base64
import os
import logging
from dotenv import load_dotenv
from flask_caching import Cache
from flask_jwt_extended import JWTManager, jwt_required, create_access_token
import pandas as pd
from logging.handlers import RotatingFileHandler

load_dotenv()

# 配置日志
log_formatter = logging.Formatter('%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]')
log_file = 'app.log'
file_handler = RotatingFileHandler(log_file, maxBytes=10240, backupCount=10)
file_handler.setFormatter(log_formatter)
file_handler.setLevel(logging.INFO)

logging.basicConfig(level=logging.INFO, handlers=[file_handler])
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

cache = Cache(app, config={'CACHE_TYPE': 'simple'})

app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'your-secret-key')
jwt = JWTManager(app)

@app.errorhandler(Exception)
def handle_exception(e):
    logger.error('未处理的异常:', exc_info=True)
    return jsonify({"error": "服务器内部错误", "details": str(e)}), 500

@app.route('/api/data', methods=['POST'])
def upload_data():
    if 'file' not in request.files:
        logger.warning("未上传文件")
        return jsonify({"error": "未上传文件"}), 400
    file = request.files['file']
    if file.filename == '':
        logger.warning("未选择文件")
        return jsonify({"error": "未选择文件"}), 400
    try:
        logger.info(f"接收到文件: {file.filename}")
        data = load_data(file)
        cleaned_data = clean_data(data)
        processed_data = process_data(cleaned_data)
        columns = cleaned_data.columns.tolist()
        preview = get_preview(cleaned_data)
        logger.info("数据处理成功")
        logger.info(f"处理后的数据: {processed_data}")
        return jsonify({"data": processed_data, "columns": columns, "preview": preview})
    except Exception as e:
        logger.exception(f"处理数据时出错:")
        return jsonify({"error": "处理数据时出错", "details": str(e)}), 500

@app.route('/api/visualize', methods=['POST'])
def visualize_data():
    try:
        data = request.json.get('data')
        chart_type = request.json.get('chartType')
        column = request.json.get('column')
        
        logger.info(f"接收到可视化请求: chart_type={chart_type}, column={column}")
        
        if not all([data, chart_type]):
            logger.warning("缺少必要的参数")
            abort(400, description="缺少必要的参数")
        
        # 将数据转换为DataFrame
        df = pd.DataFrame(data)
        
        if chart_type == 'histogram':
            fig = create_histogram(df, column, f'{column}的直方图')
        elif chart_type == 'scatter':
            x_column = request.json['xColumn']
            y_column = request.json['yColumn']
            fig = create_scatter_plot(df, x_column, y_column, f'{x_column}与{y_column}的散点图')
        elif chart_type == 'line':
            x_column = request.json['xColumn']
            y_column = request.json['yColumn']
            fig = create_line_plot(df, x_column, y_column, f'{x_column}与{y_column}的折线图')
        elif chart_type == 'pie':
            fig = create_pie_chart(df, column, f'{column}的饼图')
        elif chart_type == 'box':
            fig = create_box_plot(df, column, f'{column}的箱线图')
        elif chart_type == 'heatmap':
            fig = create_heatmap(df, '相关性热力图')
        elif chart_type == 'scatter_matrix':
            columns = request.json.get('columns', df.columns.tolist())
            fig = create_scatter_matrix(df, columns, '散点矩阵')
        elif chart_type == 'tree_map':
            values = request.json.get('values')
            labels = request.json.get('labels')
            fig = create_tree_map(df, values, labels, f'{column}的树状图')
        elif chart_type == 'dendrogram':
            fig = create_dendrogram(df, column, f'{column}的树状图')
        else:
            logger.warning(f"无效的图表类型: {chart_type}")
            return jsonify({"error": "无效的图表类型"}), 400
        
        img = io.BytesIO()
        fig.savefig(img, format='png')
        img.seek(0)
        plot_url = base64.b64encode(img.getvalue()).decode()
        logger.info("成功生成图表")
        return jsonify({"image": plot_url})
    except Exception as e:
        logger.exception("可视化数据时出错:")
        return jsonify({"error": str(e)}), 500

@app.route('/api/regression', methods=['POST'])
def perform_regression_analysis():
    try:
        data = request.json.get('data')
        x_columns = request.json.get('xColumns')
        y_column = request.json.get('yColumn')
        
        logger.info(f"接收到回归分析请求: x_columns={x_columns}, y_column={y_column}")
        
        if not all([data, x_columns, y_column]):
            logger.warning("缺少必要的参数")
            return jsonify({"error": "缺少必要的参数"}), 400
        
        df = pd.DataFrame(data)
        
        if not all(col in df.columns for col in x_columns + [y_column]):
            logger.warning(f"列名不存在")
            return jsonify({"error": "指定的列名不存在"}), 400
        
        if not all(pd.api.types.is_numeric_dtype(df[col]) for col in x_columns + [y_column]):
            logger.warning(f"非数值类型列")
            return jsonify({"error": "回归分析需要数值类型的列"}), 400
        
        result = perform_regression(df, x_columns, y_column)
        logger.info("回归分析成功")
        return jsonify(result)
    except Exception as e:
        logger.exception("回归分析时出错:")
        return jsonify({"error": str(e)}), 500

@app.route('/api/time_series', methods=['POST'])
def perform_time_series_analysis():
    try:
        data = request.json.get('data')
        column = request.json.get('column')
        periods = request.json.get('periods', 1)
        
        logger.info(f"接收到时间序列分析请求: column={column}, periods={periods}")
        
        if not all([data, column]):
            logger.warning("缺少必要的参数")
            return jsonify({"error": "缺少必要的参数"}), 400
        
        df = pd.DataFrame(data)
        
        if column not in df.columns:
            logger.warning(f"列名不存在: column={column}")
            return jsonify({"error": "指定的列名不存在"}), 400
        
        result = perform_time_series_analysis(df, column, periods)
        logger.info("时间序列分析成功")
        return jsonify(result)
    except Exception as e:
        logger.exception("时间序列分析时出错:")
        return jsonify({"error": str(e)}), 500

@app.route('/api/group_aggregate', methods=['POST'])
def group_and_aggregate_data():
    try:
        data = request.json.get('data')
        group_by = request.json.get('groupBy')
        agg_column = request.json.get('aggColumn')
        agg_func = request.json.get('aggFunc')
        
        logger.info(f"接收到数据分组聚合请求: group_by={group_by}, agg_column={agg_column}, agg_func={agg_func}")
        
        if not all([data, group_by, agg_column, agg_func]):
            logger.warning("缺少必要的参数")
            return jsonify({"error": "缺少必要的参数"}), 400
        
        df = pd.DataFrame(data)
        
        result = group_and_aggregate(df, group_by, agg_column, agg_func)
        logger.info("数据分组聚合成功")
        return jsonify(result)
    except Exception as e:
        logger.exception("数据分组聚合时出错:")
        return jsonify({"error": str(e)}), 500

@app.route('/api/preprocess', methods=['POST'])
def preprocess_data_route():
    try:
        data = request.json.get('data')
        method = request.json.get('method')
        columns = request.json.get('columns')
        
        logger.info(f"接收到数据预处理请求: method={method}, columns={columns}")
        
        if not all([data, method, columns]):
            logger.warning("缺少必要的参数")
            return jsonify({"error": "缺少必要的参数"}), 400
        
        df = pd.DataFrame(data)
        
        result = preprocess_data(df, method, columns)
        logger.info("数据预处理成功")
        return jsonify(result.to_dict(orient='list'))
    except Exception as e:
        logger.exception("数据预处理时出错:")
        return jsonify({"error": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    username = request.json.get('username', None)
    password = request.json.get('password', None)
    if username != 'admin' or password != 'password':
        return jsonify({"msg": "用户名或密码错误"}), 401
    access_token = create_access_token(identity=username)
    return jsonify(access_token=access_token)

if __name__ == '__main__':
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    port = int(os.environ.get('FLASK_PORT', 5000))
    app.run(debug=debug_mode, port=port)