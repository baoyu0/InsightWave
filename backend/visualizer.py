import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
from matplotlib import font_manager
import squarify
from scipy.cluster import hierarchy
import os  # 添加这个导入

# 设置中文字体
font_path = "C:/Windows/Fonts/simhei.ttf"  # 确保在您的环境中安装了该字体
if not os.path.exists(font_path):
    font_path = "/usr/share/fonts/truetype/arphic/ukai.ttc"  # Linux 环境中的字体路径
if os.path.exists(font_path):
    font_manager.fontManager.addfont(font_path)
    plt.rcParams["font.sans-serif"] = [
        "SimHei",
        "AR PL UKai CN",
    ]  # 用黑体和 AR PL UKai CN 显示中文
else:
    plt.rcParams["font.sans-serif"] = ["sans-serif"]  # 使用默认字体
plt.rcParams["axes.unicode_minus"] = False  # 正常显示负号


def create_histogram(data, column, title):
    """
    创建直方图
    """
    plt.figure(figsize=(10, 6))
    if isinstance(data, dict) and column in data:
        sns.histplot(data[column], kde=True)
    elif isinstance(data, pd.DataFrame) and column in data.columns:
        sns.histplot(data[column], kde=True)
    else:
        raise ValueError(f"列 '{column}' 在数据中不存在或数据格式不正确")
    plt.title(title)
    plt.xlabel(column)
    plt.ylabel("频率")
    return plt.gcf()


def create_scatter_plot(data, x_column, y_column, title):
    """
    创建散点图
    """
    plt.figure(figsize=(10, 6))
    sns.scatterplot(data=data, x=x_column, y=y_column)
    plt.title(title)
    plt.xlabel(x_column)
    plt.ylabel(y_column)
    return plt.gcf()


def create_line_plot(data, x_column, y_column, title):
    """
    创建折线图
    """
    plt.figure(figsize=(10, 6))
    sns.lineplot(data=data, x=x_column, y=y_column)
    plt.title(title)
    plt.xlabel(x_column)
    plt.ylabel(y_column)
    return plt.gcf()


def create_pie_chart(data, column, title):
    """
    创建饼图
    """
    plt.figure(figsize=(10, 6))
    if isinstance(data, dict) and column in data:
        pd.Series(data[column]).value_counts().plot(kind="pie", autopct="%1.1f%%")
    elif isinstance(data, pd.DataFrame) and column in data.columns:
        data[column].value_counts().plot(kind="pie", autopct="%1.1f%%")
    else:
        raise ValueError(f"列 '{column}' 在数据中不存在或数据格式不正确")
    plt.title(title)
    return plt.gcf()


def create_box_plot(data, column, title):
    """
    创建箱线图
    """
    plt.figure(figsize=(10, 6))
    if isinstance(data, dict):
        data = pd.DataFrame(data)

    if pd.api.types.is_numeric_dtype(data[column]):
        sns.boxplot(y=data[column])
    else:
        # 对于非数值类型，我们可以计算每个类别的频率
        value_counts = data[column].value_counts()
        sns.barplot(x=value_counts.index, y=value_counts.values)
        plt.xticks(rotation=45, ha="right")

    plt.title(title)
    plt.ylabel(column)
    return plt.gcf()


def create_heatmap(data, title):
    """
    创建热力图
    """
    plt.figure(figsize=(12, 10))
    sns.heatmap(data.corr(), annot=True, cmap="coolwarm")
    plt.title(title)
    return plt.gcf()


def create_scatter_matrix(data, columns, title):
    """
    创建散点矩阵
    """
    plt.figure(figsize=(12, 10))
    sns.pairplot(data[columns])
    plt.suptitle(title, y=1.02)
    return plt.gcf()


def create_tree_map(data, values, labels, title):
    """
    创建树状图
    """
    plt.figure(figsize=(12, 8))
    squarify.plot(sizes=values, label=labels, alpha=0.8)
    plt.title(title)
    plt.axis("off")
    return plt.gcf()


def create_dendrogram(data, column, title):
    """
    创建树状图（层次聚类树状图）
    """
    plt.figure(figsize=(12, 8))
    if isinstance(data, dict):
        data = pd.DataFrame(data)

    if pd.api.types.is_numeric_dtype(data[column]):
        # 对数值型数据进行层次聚类
        linkage = hierarchy.linkage(data[column].values.reshape(-1, 1), method="ward")
        hierarchy.dendrogram(linkage)
    else:
        # 对非数值型数据，我们可以计算每个类别的频率，然后对频率进行聚类
        value_counts = data[column].value_counts()
        linkage = hierarchy.linkage(value_counts.values.reshape(-1, 1), method="ward")
        hierarchy.dendrogram(linkage, labels=value_counts.index)

    plt.title(title)
    plt.xlabel(column)
    plt.ylabel("距离")
    return plt.gcf()


# 可以根据需要添加更多可视化函数
