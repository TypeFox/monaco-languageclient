# if hello2 is not resolved the file is not availale on the language server
from hello2 import print_hello
import numpy as np

print_hello()
print("Hello Moon!")

# Create a NumPy array
arr = np.array([1, 2, 3, 4, 5])
print("Original array:", arr)

# Perform element-wise addition
arr_added = arr + 5
print("Array after adding 5 to each element:", arr_added)

# Calculate the mean of the array
mean_value = np.mean(arr)
print("Mean of the array:", mean_value)

# Reshape the array
reshaped_arr = arr.reshape((5, 1))
print("Reshaped array (5x1):\n", reshaped_arr)

# Perform matrix multiplication
matrix1 = np.array([[1, 2], [3, 4]])
matrix2 = np.array([[5, 6], [7, 8]])
result_matrix = np.dot(matrix1, matrix2)
print("Result of matrix multiplication:\n", result_matrix)