import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { 
  Container, Typography, Box, Button, Select, MenuItem, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Grid, Card, CardContent, TextField, FormControl, InputLabel, CircularProgress, Snackbar
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MuiAlert from '@mui/material/Alert';

const theme = createTheme();

const API_URL = 'http://localhost:5000';

function App() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [chart, setChart] = useState(null);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [regressionResult, setRegressionResult] = useState(null);
  const [selectedXColumns, setSelectedXColumns] = useState([]);
  const [selectedYColumn, setSelectedYColumn] = useState('');
  const [timeSeriesResult, setTimeSeriesResult] = useState(null);
  const [groupByColumn, setGroupByColumn] = useState('');
  const [aggColumn, setAggColumn] = useState('');
  const [aggFunc, setAggFunc] = useState('');
  const [groupAggResult, setGroupAggResult] = useState(null);
  const [preprocessMethod, setPreprocessMethod] = useState('');
  const [preprocessColumns, setPreprocessColumns] = useState([]);
  const [preprocessedData, setPreprocessedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const onDrop = useCallback((acceptedFiles) => {
    handleFileUpload(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleFileUpload = async (uploadedFile) => {
    setFile(uploadedFile);
    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      console.log('Sending request to backend...');
      const response = await axios.post(`${API_URL}/api/data`, formData);
      console.log('Response received:', response.data);
      setData(response.data);
      setColumns(response.data.columns || []);
      setPreview(response.data.preview);
      setSnackbar({ open: true, message: '文件上传成功', severity: 'success' });
    } catch (error) {
      console.error('Error uploading file:', error);
      setSnackbar({ open: true, message: '上传文件时出错：' + error.message, severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisualize = async (chartType) => {
    if (!selectedColumn && !['heatmap', 'scatter_matrix'].includes(chartType)) {
      setError('请选择一个列进行可视化');
      return;
    }

    try {
      const requestData = {
        data: data.data.raw_data,
        chartType: chartType,
        column: selectedColumn,
      };

      if (chartType === 'scatter_matrix') {
        requestData.columns = columns;  // 使用所有列
      }

      console.log('Sending visualization request:', requestData);
      const response = await axios.post(`${API_URL}/api/visualize`, requestData);
      console.log('Visualization response:', response.data);
      setChart(response.data.image);
      setError(null);
    } catch (error) {
      console.error('Error visualizing data:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        setError('可视化数据时出错：' + (error.response.data.error || error.message));
      } else {
        setError('可视化数据时出错：' + error.message);
      }
    }
  };

  const handleRegression = async () => {
    if (selectedXColumns.length === 0 || !selectedYColumn) {
      setError('请选择自变量和因变量列');
      return;
    }
  
    try {
      console.log('Sending regression request:', { 
        data: data.data.raw_data, 
        xColumns: selectedXColumns, 
        yColumn: selectedYColumn 
      });
      const response = await axios.post(`${API_URL}/api/regression`, {
        data: data.data.raw_data,
        xColumns: selectedXColumns,
        yColumn: selectedYColumn,
      });
      console.log('Regression response:', response.data);
      setRegressionResult(response.data);
      setError(null);
    } catch (error) {
      console.error('Error performing regression analysis:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        setError('执行回归分析时出错：' + (error.response.data.error || error.message));
      } else {
        setError('执行回归分析时出错：' + error.message);
      }
    }
  };

  const handleTimeSeries = async () => {
    if (!selectedColumn) {
      setError('请选择一个列进行时间序列分析');
      return;
    }

    try {
      console.log('Sending time series analysis request:', { data: data.data.raw_data, column: selectedColumn });
      const response = await axios.post(`${API_URL}/api/time_series`, {
        data: data.data.raw_data,
        column: selectedColumn,
        periods: 5  // 预测未来5个时间点
      });
      console.log('Time series analysis response:', response.data);
      setTimeSeriesResult(response.data);
      setError(null);
    } catch (error) {
      console.error('Error performing time series analysis:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        setError('执行时间序列分析时出错：' + (error.response.data.error || error.message));
      } else {
        setError('执行时间序列分析时出错：' + error.message);
      }
    }
  };

  const handleGroupAggregate = async () => {
    if (!groupByColumn || !aggColumn || !aggFunc) {
      setError('请选择分组列、聚合列和聚合函数');
      return;
    }

    try {
      console.log('Sending group aggregation request:', { data: data.data.raw_data, groupBy: groupByColumn, aggColumn: aggColumn, aggFunc: aggFunc });
      const response = await axios.post(`${API_URL}/api/group_aggregate`, {
        data: data.data.raw_data,
        groupBy: groupByColumn,
        aggColumn: aggColumn,
        aggFunc: aggFunc
      });
      console.log('Group aggregation response:', response.data);
      setGroupAggResult(response.data);
      setError(null);
    } catch (error) {
      console.error('Error performing group aggregation:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        setError('执行分组聚合时出错：' + (error.response.data.error || error.message));
      } else {
        setError('执行分组聚合时出错：' + error.message);
      }
    }
  };

  const handlePreprocess = async () => {
    if (!preprocessMethod || preprocessColumns.length === 0) {
      setError('请选择预处理方法和列');
      return;
    }

    try {
      console.log('Sending data preprocessing request:', { data: data.data.raw_data, method: preprocessMethod, columns: preprocessColumns });
      const response = await axios.post(`${API_URL}/api/preprocess`, {
        data: data.data.raw_data,
        method: preprocessMethod,
        columns: preprocessColumns
      });
      console.log('Data preprocessing response:', response.data);
      setPreprocessedData(response.data);
      setError(null);
    } catch (error) {
      console.error('Error preprocessing data:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        setError('执行数据预处理时出错：' + (error.response.data.error || error.message));
      } else {
        setError('执行数据预处理时出错：' + error.message);
      }
    }
  };

  useEffect(() => {
    if (window.require) {
      const ipcRenderer = window.require('electron').ipcRenderer;
      ipcRenderer.on('message', function(event, text) {
        console.log(text);
        // 这里可以设置状态来在 UI 中显示更新信息
      });
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            数据分析与可视化应用
          </Typography>
          
          {/* 文件上传卡片 */}
          <Card {...getRootProps()} sx={{ 
            p: 2, 
            border: '2px dashed #cccccc', 
            borderRadius: 2, 
            textAlign: 'center', 
            cursor: 'pointer',
            mb: 4
          }}>
            <input {...getInputProps()} />
            <CloudUploadIcon sx={{ fontSize: 48, mb: 2 }} />
            <Typography>
              {isDragActive ? '将文件拖放到此处 ...' : '拖放文件到此处，或点击选择文件'}
            </Typography>
          </Card>

          {error && (
            <Typography color="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Typography>
          )}

          {/* 数据预览卡片 */}
          {preview && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>数据预览</Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {columns.map(column => (
                          <TableCell key={column}>{column}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {preview.map((row, index) => (
                        <TableRow key={index}>
                          {columns.map(column => (
                            <TableCell key={column}>{row[column]}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {data && (
            <Grid container spacing={4}>
              {/* 数据统计卡片 */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" gutterBottom>数据统计</Typography>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {JSON.stringify(data.data.statistics, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </Grid>

              {/* 数据分析功能卡片 */}
              <Grid item xs={12} md={6}>
                <Grid container spacing={2}>
                  {/* 列选择卡片 */}
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>列选择</Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <Select
                              fullWidth
                              value={selectedColumn}
                              onChange={(e) => setSelectedColumn(e.target.value)}
                              displayEmpty
                            >
                              <MenuItem value="">选择列</MenuItem>
                              {columns.map(column => (
                                <MenuItem key={column} value={column}>{column}</MenuItem>
                              ))}
                            </Select>
                          </Grid>
                          <Grid item xs={6}>
                            <Select
                              fullWidth
                              value={selectedXColumns}
                              onChange={(e) => setSelectedXColumns(e.target.value)}
                              displayEmpty
                              multiple
                            >
                              <MenuItem value="">选择自变量列</MenuItem>
                              {columns.map(column => (
                                <MenuItem key={column} value={column}>{column}</MenuItem>
                              ))}
                            </Select>
                          </Grid>
                          <Grid item xs={6}>
                            <Select
                              fullWidth
                              value={selectedYColumn}
                              onChange={(e) => setSelectedYColumn(e.target.value)}
                              displayEmpty
                            >
                              <MenuItem value="">选择因变量列</MenuItem>
                              {columns.map(column => (
                                <MenuItem key={column} value={column}>{column}</MenuItem>
                              ))}
                            </Select>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* 数据可视化卡片 */}
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>数据可视化</Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          注意：箱线图和直方图仅适用于数值类型的列
                        </Typography>
                        <Grid container spacing={1}>
                          <Grid item xs={6}><Button fullWidth variant="outlined" onClick={() => handleVisualize('histogram')}>创建直方图</Button></Grid>
                          <Grid item xs={6}><Button fullWidth variant="outlined" onClick={() => handleVisualize('pie')}>创建饼图</Button></Grid>
                          <Grid item xs={6}><Button fullWidth variant="outlined" onClick={() => handleVisualize('box')}>创建箱线图</Button></Grid>
                          <Grid item xs={6}><Button fullWidth variant="outlined" onClick={() => handleVisualize('heatmap')}>创建热力图</Button></Grid>
                          <Grid item xs={6}><Button fullWidth variant="outlined" onClick={() => handleVisualize('scatter_matrix')}>创建散点矩阵</Button></Grid>
                          <Grid item xs={6}><Button fullWidth variant="outlined" onClick={() => handleVisualize('dendrogram')}>创建树状图</Button></Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* 高级分析卡片 */}
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>高级分析</Typography>
                        <Grid container spacing={1}>
                          <Grid item xs={12}><Button fullWidth variant="contained" onClick={handleRegression}>执行回归分析</Button></Grid>
                          <Grid item xs={12}><Button fullWidth variant="contained" onClick={handleTimeSeries}>执行时间序列分析</Button></Grid>
                          <Grid item xs={12}><Button fullWidth variant="contained" onClick={handleGroupAggregate}>执行分组聚合</Button></Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* 数据处理卡片 */}
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>数据处理</Typography>
                        <Grid container spacing={1}>
                          <Grid item xs={12}><Button fullWidth variant="contained" color="secondary" onClick={handlePreprocess}>执行数据预处理</Button></Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}

          {/* 结果显示卡片 */}
          {regressionResult && (
            <Card sx={{ mt: 4 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>回归分析结果</Typography>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {JSON.stringify(regressionResult, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {timeSeriesResult && (
            <Card sx={{ mt: 4 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>时间序列分析结果</Typography>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {JSON.stringify(timeSeriesResult, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {groupAggResult && (
            <Card sx={{ mt: 4 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>分组聚合结果</Typography>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {JSON.stringify(groupAggResult, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {preprocessedData && (
            <Card sx={{ mt: 4 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>预处理后的数据</Typography>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {JSON.stringify(preprocessedData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {chart && (
            <Card sx={{ mt: 4 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>数据可视化</Typography>
                <img src={`data:image/png;base64,${chart}`} alt="Data Visualization" style={{ maxWidth: '100%' }} />
              </CardContent>
            </Card>
          )}
        </Box>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress />
          </Box>
        )}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <MuiAlert elevation={6} variant="filled" severity={snackbar.severity}>
            {snackbar.message}
          </MuiAlert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default App;